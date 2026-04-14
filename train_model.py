from src.modeling import save_artifacts, train_best_model


def main() -> None:
    print("Downloading dataset and training RumahAI model...")
    artifacts = train_best_model()
    save_artifacts(artifacts)

    print("\nTraining complete.")
    print(f"Best model: {artifacts.best_model_name}")
    print("\nModel comparison:")
    for model_name, metrics in artifacts.metrics.items():
        print(
            f"- {model_name}: "
            f"RMSE={metrics['RMSE']:.2f}, MAE={metrics['MAE']:.2f}, R2={metrics['R2']:.4f}"
        )
    print("\nSaved:")
    print("- models/rumahai_pipeline.joblib")
    print("- models/rumahai_metadata.joblib")


if __name__ == "__main__":
    main()
