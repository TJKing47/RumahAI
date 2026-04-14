from __future__ import annotations

import math

import pandas as pd
import streamlit as st

from src.modeling import get_model_explanation, load_artifacts, predict_price

st.set_page_config(page_title="RumahAI", page_icon="🏠", layout="wide")


def format_myr(value: float) -> str:
    return f"RM {value:,.0f}"


def main() -> None:
    st.title("🏠 RumahAI")
    st.caption("Predictive House Price Estimation in Malaysia")

    try:
        _, metadata = load_artifacts()
    except FileNotFoundError:
        st.error("Model not found. Run `python train_model.py` in the terminal first.")
        st.code("python train_model.py")
        st.stop()

    categories = metadata["categories"]
    metrics = metadata["metrics"]
    best_model_name = metadata["best_model_name"]

    with st.sidebar:
        st.header("Model Info")
        st.write(f"**Selected model:** {best_model_name}")
        st.write("**Metrics**")
        best_metrics = metrics[best_model_name]
        st.write(f"RMSE: {best_metrics['RMSE']:,.2f}")
        st.write(f"MAE: {best_metrics['MAE']:,.2f}")
        st.write(f"R²: {best_metrics['R2']:.4f}")
        st.info("This app uses the Kaggle dataset `lyhatt/house-prices-in-malaysia-2025`.")

    st.subheader("Enter property details")
    left, right = st.columns(2)

    with left:
        township = st.selectbox("Township", categories["Township"])
        area = st.selectbox("Area", categories["Area"])
        state = st.selectbox("State", categories["State"])
        tenure = st.selectbox("Tenure", categories["Tenure"])

    with right:
        property_type = st.selectbox("Type", categories["Type"])
        median_psf = st.number_input(
            "Median PSF (RM)", min_value=1.0, max_value=5000.0, value=300.0, step=1.0
        )
        transactions = st.number_input(
            "Transactions", min_value=0, max_value=10000, value=50, step=1
        )

    submitted = st.button("Predict Price", type="primary", use_container_width=True)

    if submitted:
        input_data = {
            "Township": township,
            "Area": area,
            "State": state,
            "Tenure": tenure,
            "Type": property_type,
            "Median_PSF": float(median_psf),
            "Transactions": int(transactions),
        }

        try:
            prediction = predict_price(input_data)
            st.success("Prediction generated successfully.")
            st.metric("Predicted Median Price", format_myr(prediction))

            approx_size = prediction / median_psf if median_psf else math.nan
            cols = st.columns(3)
            cols[0].metric("Median PSF Used", f"RM {median_psf:,.0f}")
            cols[1].metric("Transactions", f"{transactions:,}")
            cols[2].metric(
                "Implied Approx. Size",
                f"{approx_size:,.0f} sqft" if not math.isnan(approx_size) else "N/A",
            )

            st.subheader("Prediction Explanation")
            explanation = get_model_explanation(input_data)
            if explanation:
                exp_df = pd.DataFrame(explanation, columns=["Feature", "Contribution Score"])
                st.bar_chart(exp_df.set_index("Feature"))
                st.caption("Higher bars suggest a stronger estimated influence on this prediction.")
            else:
                st.info("Explanation is not available for the selected model.")

        except Exception as exc:
            st.error(f"Prediction failed: {exc}")

    st.markdown("---")
    st.write(
        "Built to match your FYP direction: user input, validation, preprocessing, model loading, house price prediction, and clear output."
    )


if __name__ == "__main__":
    main()
