from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Tuple

import joblib
import kagglehub
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

REQUIRED_COLUMNS = [
    "Township",
    "Area",
    "State",
    "Tenure",
    "Type",
    "Median_Price",
    "Median_PSF",
    "Transactions",
]

FEATURE_COLUMNS = [
    "Township",
    "Area",
    "State",
    "Tenure",
    "Type",
    "Median_PSF",
    "Transactions",
]
TARGET_COLUMN = "Median_Price"
CATEGORICAL_COLUMNS = ["Township", "Area", "State", "Tenure", "Type"]
NUMERIC_COLUMNS = ["Median_PSF", "Transactions"]

MODEL_PATH = Path("models/rumahai_pipeline.joblib")
META_PATH = Path("models/rumahai_metadata.joblib")


@dataclass
class TrainingArtifacts:
    pipeline: Pipeline
    metrics: Dict[str, Dict[str, float]]
    best_model_name: str
    training_columns: List[str]
    categories: Dict[str, List[str]]


def download_dataset() -> Path:
    dataset_dir = Path(kagglehub.dataset_download("lyhatt/house-prices-in-malaysia-2025"))
    return dataset_dir



def find_csv_file(dataset_dir: Path) -> Path:
    csv_files = list(dataset_dir.glob("*.csv"))
    if not csv_files:
        raise FileNotFoundError(f"No CSV file found in dataset folder: {dataset_dir}")
    return csv_files[0]



def load_dataset() -> pd.DataFrame:
    dataset_dir = download_dataset()
    csv_file = find_csv_file(dataset_dir)
    df = pd.read_csv(csv_file)

    missing = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing:
        raise ValueError(f"Dataset is missing required columns: {missing}")

    df = df[REQUIRED_COLUMNS].copy()

    # Basic cleaning
    for col in CATEGORICAL_COLUMNS:
        df[col] = df[col].astype(str).str.strip()

    df["Median_PSF"] = pd.to_numeric(df["Median_PSF"], errors="coerce")
    df["Transactions"] = pd.to_numeric(df["Transactions"], errors="coerce")
    df["Median_Price"] = pd.to_numeric(df["Median_Price"], errors="coerce")

    df = df.dropna(subset=[TARGET_COLUMN])
    df = df[(df["Median_PSF"] > 0) & (df["Transactions"] >= 0) & (df[TARGET_COLUMN] > 0)]
    df = df.reset_index(drop=True)
    return df



def build_preprocessor() -> ColumnTransformer:
    categorical_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore")),
        ]
    )

    numeric_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )

    return ColumnTransformer(
        transformers=[
            ("cat", categorical_transformer, CATEGORICAL_COLUMNS),
            ("num", numeric_transformer, NUMERIC_COLUMNS),
        ]
    )



def get_candidate_models() -> Dict[str, object]:
    return {
        "Linear Regression": LinearRegression(),
        "Random Forest": RandomForestRegressor(
            n_estimators=300,
            max_depth=None,
            min_samples_split=2,
            random_state=42,
            n_jobs=-1,
        ),
        "Gradient Boosting": GradientBoostingRegressor(random_state=42),
    }



def evaluate_model(y_true: pd.Series, y_pred: np.ndarray) -> Dict[str, float]:
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    mae = float(mean_absolute_error(y_true, y_pred))
    r2 = float(r2_score(y_true, y_pred))
    return {"RMSE": rmse, "MAE": mae, "R2": r2}



def train_best_model() -> TrainingArtifacts:
    df = load_dataset()
    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    metrics: Dict[str, Dict[str, float]] = {}
    best_pipeline: Pipeline | None = None
    best_model_name = ""
    best_rmse = float("inf")

    for model_name, model in get_candidate_models().items():
        pipeline = Pipeline(
            steps=[
                ("preprocessor", build_preprocessor()),
                ("model", model),
            ]
        )
        pipeline.fit(X_train, y_train)
        preds = pipeline.predict(X_test)
        model_metrics = evaluate_model(y_test, preds)
        metrics[model_name] = model_metrics

        if model_metrics["RMSE"] < best_rmse:
            best_rmse = model_metrics["RMSE"]
            best_pipeline = pipeline
            best_model_name = model_name

    assert best_pipeline is not None

    categories = {
        col: sorted(df[col].dropna().astype(str).unique().tolist())
        for col in CATEGORICAL_COLUMNS
    }

    return TrainingArtifacts(
        pipeline=best_pipeline,
        metrics=metrics,
        best_model_name=best_model_name,
        training_columns=FEATURE_COLUMNS,
        categories=categories,
    )



def save_artifacts(artifacts: TrainingArtifacts) -> None:
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(artifacts.pipeline, MODEL_PATH)
    metadata = {
        "metrics": artifacts.metrics,
        "best_model_name": artifacts.best_model_name,
        "training_columns": artifacts.training_columns,
        "categories": artifacts.categories,
        "feature_columns": FEATURE_COLUMNS,
        "target_column": TARGET_COLUMN,
    }
    joblib.dump(metadata, META_PATH)



def load_artifacts() -> Tuple[Pipeline, dict]:
    if not MODEL_PATH.exists() or not META_PATH.exists():
        raise FileNotFoundError(
            "Model artifacts not found. Run `python train_model.py` first."
        )
    pipeline = joblib.load(MODEL_PATH)
    metadata = joblib.load(META_PATH)
    return pipeline, metadata



def predict_price(input_data: dict) -> float:
    pipeline, _ = load_artifacts()
    input_df = pd.DataFrame([input_data])
    prediction = float(pipeline.predict(input_df)[0])
    return prediction



def get_model_explanation(input_data: dict) -> List[Tuple[str, float]]:
    pipeline, metadata = load_artifacts()
    model = pipeline.named_steps["model"]
    preprocessor = pipeline.named_steps["preprocessor"]
    transformed = preprocessor.transform(pd.DataFrame([input_data]))

    # Feature names after preprocessing
    try:
        feature_names = preprocessor.get_feature_names_out().tolist()
    except Exception:
        return []

    if hasattr(model, "feature_importances_"):
        importances = np.asarray(model.feature_importances_)
        if transformed.ndim == 2:
            row_values = np.asarray(transformed)[0]
        else:
            row_values = transformed

        contributions = []
        for name, val, imp in zip(feature_names, row_values, importances):
            contributions.append((name, float(abs(val) * imp)))
        contributions.sort(key=lambda x: x[1], reverse=True)
        return contributions[:8]

    # For linear regression, approximate contribution with coefficient * feature value.
    if hasattr(model, "coef_"):
        coefs = np.asarray(model.coef_)
        row_values = np.asarray(transformed)[0]
        contributions = []
        for name, val, coef in zip(feature_names, row_values, coefs):
            contributions.append((name, float(abs(val * coef))))
        contributions.sort(key=lambda x: x[1], reverse=True)
        return contributions[:8]

    return []
