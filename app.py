from __future__ import annotations

from flask import Flask, jsonify, request
from flask_cors import CORS

from src.modeling import (
    get_model_explanation,
    load_artifacts,
    predict_price,
    get_state_market_summary,
    get_area_market_summary,
)
from src.scrapers.mudah_scraper_selenium import summarize_mudah_benchmark

app = Flask(__name__)
CORS(app)


def compute_market_adjusted_price(
    predicted_price: float,
    benchmark: dict | None,
) -> tuple[float, float, float | None, int]:
    """
    Blend the ML prediction with the live benchmark median so that
    the final value is more market-aware without fully replacing the model.
    Returns:
        adjusted_price, weight_used, market_median, listing_count
    """
    if not benchmark:
        return predicted_price, 0.0, None, 0

    market_median = benchmark.get("median_price")
    listing_count = int(benchmark.get("listing_count") or 0)

    if not market_median or market_median <= 0:
        return predicted_price, 0.0, None, listing_count

    ratio = market_median / max(predicted_price, 1.0)

    # Dynamic weight:
    # - more listings => trust live benchmark slightly more
    # - huge mismatch => trust live benchmark less to avoid overcorrection
    if listing_count >= 8:
        weight = 0.45
    elif listing_count >= 4:
        weight = 0.35
    else:
        weight = 0.25

    if ratio > 1.8 or ratio < 0.55:
        weight = min(weight, 0.20)

    adjusted_price = (predicted_price * (1.0 - weight)) + (market_median * weight)
    adjusted_price = max(float(adjusted_price), 0.0)

    return adjusted_price, float(weight), float(market_median), listing_count


@app.get("/")
def home():
    return jsonify({
        "message": "RumahAI Flask API is running"
    })


@app.get("/health")
def health():
    try:
        _, metadata = load_artifacts()
        return jsonify({
            "status": "ok",
            "model_loaded": True,
            "best_model": metadata.get("best_model_name", "unknown")
        })
    except FileNotFoundError:
        return jsonify({
            "status": "warning",
            "model_loaded": False,
            "message": "Model artifacts not found. Run python train_model.py first."
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "model_loaded": False,
            "message": str(e)
        }), 500


@app.post("/predict")
def predict():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "No JSON body provided"}), 400

        required_fields = [
            "Township",
            "Area",
            "State",
            "Tenure",
            "Type",
            "Median_PSF",
            "Transactions",
        ]

        missing = [field for field in required_fields if field not in data]
        if missing:
            return jsonify({"error": f"Missing required fields: {missing}"}), 400

        input_data = {
            "Township": str(data["Township"]).strip(),
            "Area": str(data["Area"]).strip(),
            "State": str(data["State"]).strip(),
            "Tenure": str(data["Tenure"]).strip(),
            "Type": str(data["Type"]).strip(),
            "Median_PSF": float(data["Median_PSF"]),
            "Transactions": float(data["Transactions"]),
        }

        if input_data["Median_PSF"] <= 0:
            return jsonify({"error": "Median_PSF must be greater than 0"}), 400

        if input_data["Transactions"] < 0:
            return jsonify({"error": "Transactions cannot be negative"}), 400

        predicted_price = predict_price(input_data)
        explanation = get_model_explanation(input_data)

        # Live benchmark layer
        benchmark = None
        try:
            benchmark = summarize_mudah_benchmark(
                state=input_data["State"],
                property_type=input_data["Type"],
                max_items=10,
                use_selenium=True,
                wait_seconds=5.0,
            )
        except Exception:
            benchmark = None

        adjusted_price, adjustment_weight, market_median, listing_count = compute_market_adjusted_price(
            predicted_price=predicted_price,
            benchmark=benchmark,
        )

        formatted_explanation = [
            {"feature": feature, "importance": importance}
            for feature, importance in explanation
        ]

        response = {
            "predicted_price": round(predicted_price, 2),
            "adjusted_price": round(adjusted_price, 2),
            "market_median": round(market_median, 2) if market_median else None,
            "market_adjustment_weight": adjustment_weight,
            "benchmark_listing_count": listing_count,
            "explanation": formatted_explanation,
        }

        if benchmark:
            response["benchmark_summary"] = {
                "source": benchmark.get("source"),
                "median_price": benchmark.get("median_price"),
                "median_psf": benchmark.get("median_psf"),
                "listing_count": benchmark.get("listing_count"),
                "min_price": benchmark.get("min_price"),
                "max_price": benchmark.get("max_price"),
            }

        return jsonify(response)

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except FileNotFoundError:
        return jsonify({
            "error": "Model artifacts not found. Run python train_model.py first."
        }), 500
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500


@app.post("/market-benchmark")
def market_benchmark():
    try:
        data = request.get_json() or {}

        state = data.get("State")
        property_type = data.get("Type")

        benchmark = summarize_mudah_benchmark(
            state=state,
            property_type=property_type,
            max_items=10,
            use_selenium=True,
            wait_seconds=5.0,
        )

        return jsonify(benchmark)

    except Exception as e:
        return jsonify({
            "error": f"Benchmark scraping failed: {str(e)}"
        }), 500


@app.get("/market-trends/states")
def market_trends_states():
    """
    Returns state-level housing market summary from the local/Kaggle dataset.
    Used by the Market Trends frontend graph.
    """
    try:
        data = get_state_market_summary()
        return jsonify({"data": data})
    except Exception as e:
        return jsonify({
            "error": f"State market trends failed: {str(e)}"
        }), 500


@app.get("/market-trends/areas/<state>")
def market_trends_areas(state):
    """
    Returns area-level housing market summary for the selected state.
    Used by the Market Trends frontend area comparison graph.
    """
    try:
        data = get_area_market_summary(state)
        return jsonify({"data": data})
    except Exception as e:
        return jsonify({
            "error": f"Area market trends failed: {str(e)}"
        }), 500


if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)