from __future__ import annotations

from flask import Flask, jsonify, request
from flask_cors import CORS

from src.modeling import get_model_explanation, load_artifacts, predict_price

app = Flask(__name__)
CORS(app)


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
            return jsonify({
                "error": f"Missing required fields: {missing}"
            }), 400

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

        formatted_explanation = [
            {"feature": feature, "importance": importance}
            for feature, importance in explanation
        ]

        return jsonify({
            "predicted_price": round(predicted_price, 2),
            "explanation": formatted_explanation
        })

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except FileNotFoundError:
        return jsonify({
            "error": "Model artifacts not found. Run python train_model.py first."
        }), 500
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)