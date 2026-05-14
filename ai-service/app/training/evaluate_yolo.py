import argparse
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate a trained YOLO defect model.")
    parser.add_argument("--model", default="app/models/defect-yolo.pt", help="Trained YOLO model path.")
    parser.add_argument("--data", default="app/training/data.yaml", help="YOLO data.yaml path.")
    return parser.parse_args()


def _metric(metrics: object, name: str) -> float:
    box_metrics = getattr(metrics, "box", metrics)
    return float(getattr(box_metrics, name, 0.0))


def main() -> None:
    args = parse_args()
    model_path = Path(args.model)
    data_path = Path(args.data)

    if not model_path.exists():
        raise SystemExit(f"model does not exist: {model_path}")

    if not data_path.exists():
        raise SystemExit(f"data.yaml does not exist: {data_path}")

    from ultralytics import YOLO

    model = YOLO(str(model_path))
    metrics = model.val(data=str(data_path))

    print(f"precision={_metric(metrics, 'mp'):.4f}")
    print(f"recall={_metric(metrics, 'mr'):.4f}")
    print(f"mAP50={_metric(metrics, 'map50'):.4f}")
    print(f"mAP50-95={_metric(metrics, 'map'):.4f}")


if __name__ == "__main__":
    main()
