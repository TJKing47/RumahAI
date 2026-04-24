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
    psf_clip_lower: float
    psf_clip_upper: float
    target_log_transform: bool
    transactions_log_transform: bool


def download_dataset() -> Path:
    dataset_dir = Path(kagglehub.dataset_download("lyhatt/house-prices-in-malaysia-2025"))
    return dataset_dir


def find_csv_file(dataset_dir: Path) -> Path:
    csv_files = list(dataset_dir.glob("*.csv"))
    if not csv_files:
        raise FileNotFoundError(f"No CSV file found in dataset folder: {dataset_dir}")
    return csv_files[0]


def load_dataset() -> pd.DataFrame:
    """
    Load the Malaysia house price dataset.

    Priority:
    1. Local CSV in project root: malaysia_house_price_data_2025.csv
    2. Local CSV in data folder: data/malaysia_house_price_data_2025.csv
    3. KaggleHub fallback
    """
    project_root = Path(__file__).resolve().parents[1]

    local_candidates = [
        project_root / "malaysia_house_price_data_2025.csv",
        project_root / "data" / "malaysia_house_price_data_2025.csv",
    ]

    csv_file = None

    for candidate in local_candidates:
        if candidate.exists():
            csv_file = candidate
            break

    if csv_file is None:
        dataset_dir = download_dataset()
        csv_file = find_csv_file(dataset_dir)

    df = pd.read_csv(csv_file)

    missing = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing:
        raise ValueError(f"Dataset is missing required columns: {missing}")

    df = df[REQUIRED_COLUMNS].copy()

    for col in CATEGORICAL_COLUMNS:
        df[col] = df[col].astype(str).str.strip()

    df["Median_PSF"] = pd.to_numeric(df["Median_PSF"], errors="coerce")
    df["Transactions"] = pd.to_numeric(df["Transactions"], errors="coerce")
    df["Median_Price"] = pd.to_numeric(df["Median_Price"], errors="coerce")

    df = df.dropna(subset=[TARGET_COLUMN])
    df = df[(df["Median_PSF"] > 0) & (df["Transactions"] >= 0) & (df[TARGET_COLUMN] > 0)]
    df = df.reset_index(drop=True)
    return df

def apply_feature_transformations(
    df: pd.DataFrame,
    psf_clip_bounds: Tuple[float, float] | None = None,
    fit: bool = False,
) -> Tuple[pd.DataFrame, Tuple[float, float]]:
    df = df.copy()

    if fit or psf_clip_bounds is None:
        psf_lower = float(df["Median_PSF"].quantile(0.05))
        psf_upper = float(df["Median_PSF"].quantile(0.95))
    else:
        psf_lower, psf_upper = psf_clip_bounds

    df["Median_PSF"] = df["Median_PSF"].clip(lower=psf_lower, upper=psf_upper)

    # Reduce dominance of raw transaction scale
    df["Transactions"] = np.log1p(df["Transactions"].clip(lower=0))

    return df, (psf_lower, psf_upper)


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
            min_samples_split=4,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1,
        ),
        "Gradient Boosting": GradientBoostingRegressor(
            random_state=42,
            n_estimators=250,
            learning_rate=0.05,
            max_depth=3,
        ),
    }


def evaluate_model(y_true: pd.Series, y_pred: np.ndarray) -> Dict[str, float]:
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    mae = float(mean_absolute_error(y_true, y_pred))
    r2 = float(r2_score(y_true, y_pred))
    return {"RMSE": rmse, "MAE": mae, "R2": r2}


def train_best_model() -> TrainingArtifacts:
    df = load_dataset()
    df, psf_bounds = apply_feature_transformations(df, fit=True)

    X = df[FEATURE_COLUMNS]
    y_raw = df[TARGET_COLUMN]

    X_train, X_test, y_train_raw, y_test_raw = train_test_split(
        X, y_raw, test_size=0.2, random_state=42
    )

    # Train on log target to reduce extreme skew
    y_train = np.log1p(y_train_raw)

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
        preds_log = pipeline.predict(X_test)
        preds = np.expm1(preds_log)

        model_metrics = evaluate_model(y_test_raw, preds)
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
        psf_clip_lower=psf_bounds[0],
        psf_clip_upper=psf_bounds[1],
        target_log_transform=True,
        transactions_log_transform=True,
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
        "psf_clip_lower": artifacts.psf_clip_lower,
        "psf_clip_upper": artifacts.psf_clip_upper,
        "target_log_transform": artifacts.target_log_transform,
        "transactions_log_transform": artifacts.transactions_log_transform,
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


def prepare_input_frame(input_data: dict, metadata: dict) -> pd.DataFrame:
    input_df = pd.DataFrame([input_data]).copy()

    psf_lower = metadata.get("psf_clip_lower")
    psf_upper = metadata.get("psf_clip_upper")

    if psf_lower is not None and psf_upper is not None:
        input_df["Median_PSF"] = input_df["Median_PSF"].clip(lower=psf_lower, upper=psf_upper)

    if metadata.get("transactions_log_transform", False):
        input_df["Transactions"] = np.log1p(input_df["Transactions"].clip(lower=0))

    return input_df


def predict_price(input_data: dict) -> float:
    pipeline, metadata = load_artifacts()
    input_df = prepare_input_frame(input_data, metadata)

    prediction = float(pipeline.predict(input_df)[0])

    if metadata.get("target_log_transform", False):
        prediction = float(np.expm1(prediction))

    return max(prediction, 0.0)


def get_model_explanation(input_data: dict) -> List[Tuple[str, float]]:
    pipeline, metadata = load_artifacts()
    model = pipeline.named_steps["model"]
    preprocessor = pipeline.named_steps["preprocessor"]

    input_df = prepare_input_frame(input_data, metadata)
    transformed = preprocessor.transform(input_df)

    try:
        feature_names = preprocessor.get_feature_names_out().tolist()
    except Exception:
        return []

    if hasattr(transformed, "toarray"):
        row_values = transformed.toarray()[0]
    else:
        row_values = np.asarray(transformed).reshape(1, -1)[0]

    if hasattr(model, "feature_importances_"):
        importances = np.asarray(model.feature_importances_)
        contributions = []

        for name, val, imp in zip(feature_names, row_values, importances):
            contributions.append((name, float(abs(val) * imp)))

        contributions.sort(key=lambda x: x[1], reverse=True)
        return contributions[:8]

    if hasattr(model, "coef_"):
        coefs = np.asarray(model.coef_).ravel()
        contributions = []

        for name, val, coef in zip(feature_names, row_values, coefs):
            contributions.append((name, float(abs(val * coef))))

        contributions.sort(key=lambda x: x[1], reverse=True)
        return contributions[:8]

    return []


def get_state_market_summary() -> list[dict]:
    """
    Returns state-level housing market summary from the local/Kaggle dataset.
    Used by the Market Trends frontend graph.
    """
    df = load_dataset()

    summary = (
        df.groupby("State", dropna=False)
        .agg(
            average_price=("Median_Price", "mean"),
            median_price=("Median_Price", "median"),
            average_psf=("Median_PSF", "mean"),
            transactions=("Transactions", "sum"),
            sample_count=("Median_Price", "count"),
        )
        .reset_index()
        .sort_values("average_price", ascending=False)
    )

    summary["State"] = summary["State"].astype(str)

    return summary.round(2).to_dict(orient="records")


def get_area_market_summary(state: str) -> list[dict]:
    """
    Returns area-level housing market summary for one selected state.
    Used by the Market Trends frontend area comparison graph.
    """
    df = load_dataset()

    selected_state = str(state).strip().lower()
    filtered = df[df["State"].astype(str).str.strip().str.lower() == selected_state]

    if filtered.empty:
        return []

    summary = (
        filtered.groupby("Area", dropna=False)
        .agg(
            average_price=("Median_Price", "mean"),
            median_price=("Median_Price", "median"),
            average_psf=("Median_PSF", "mean"),
            transactions=("Transactions", "sum"),
            sample_count=("Median_Price", "count"),
        )
        .reset_index()
        .sort_values("average_price", ascending=False)
        .head(15)
    )

    summary["Area"] = summary["Area"].astype(str)

    return summary.round(2).to_dict(orient="records")

