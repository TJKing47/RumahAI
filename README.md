# RumahAI

RumahAI is a local Streamlit web app that predicts Malaysian house prices using the Kaggle dataset `lyhatt/house-prices-in-malaysia-2025`.

## What this project includes
- Dataset download using `kagglehub`
- Data cleaning and preprocessing
- Model comparison: Linear Regression, Random Forest, Gradient Boosting
- Best-model selection using RMSE, MAE, and R²
- Saved model pipeline in `models/`
- Streamlit web app for prediction
- Feature-importance style explanation for supported models

## Dataset columns used
The Kaggle dataset contains 2,000 rows and 8 columns: `Township`, `Area`, `State`, `Tenure`, `Type`, `Median_Price`, `Median_PSF`, and `Transactions`.

RumahAI uses:
- Features: `Township`, `Area`, `State`, `Tenure`, `Type`, `Median_PSF`, `Transactions`
- Target: `Median_Price`

## Run steps
### 1. Install packages
```bash
pip install -r requirements.txt
```

### 2. Train the model
```bash
python train_model.py
```

### 3. Launch the web app
```bash
streamlit run app.py
```

## Notes
- The first training run downloads the dataset automatically.
- The app expects a trained model at `models/rumahai_pipeline.joblib`.
- If the model is missing, run `python train_model.py` first.
