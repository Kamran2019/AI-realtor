import argparse
import shutil
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export a trained YOLO model into the AI service.")
    parser.add_argument("--model", required=True, help="Source trained model path.")
    parser.add_argument("--output", default="app/models/defect-yolo.pt", help="Output model path.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    model_path = Path(args.model)
    output_path = Path(args.output)

    if not model_path.exists():
        raise SystemExit(f"model does not exist: {model_path}")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(model_path, output_path)
    print(f"exported_model_path={output_path}")


if __name__ == "__main__":
    main()
