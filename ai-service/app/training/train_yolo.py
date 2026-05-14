import argparse
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train a YOLO defect detection model.")
    parser.add_argument("--model", default="yolo11n.pt", help="Base YOLO model or checkpoint.")
    parser.add_argument("--data", default="app/training/data.yaml", help="YOLO data.yaml path.")
    parser.add_argument("--epochs", type=int, default=50)
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--batch", type=int, default=16)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    data_path = Path(args.data)

    if not data_path.exists():
        raise SystemExit(f"data.yaml does not exist: {data_path}")

    from ultralytics import YOLO

    model = YOLO(args.model)
    results = model.train(
        data=str(data_path),
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
    )

    save_dir = Path(getattr(results, "save_dir", "runs/detect/train"))
    best_model_path = save_dir / "weights" / "best.pt"
    metrics_path = save_dir / "results.csv"

    print(f"best_model_path={best_model_path}")
    print(f"metrics_path={metrics_path}")


if __name__ == "__main__":
    main()
