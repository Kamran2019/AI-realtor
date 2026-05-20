# YOLO Defect Detection Training

This folder contains the free/open-source YOLO training scaffold for the AI Realtor defect detector.

## Dataset

Place YOLO-format images and labels under `app/training/datasets/defects`:

```text
images/train
images/val
images/test
labels/train
labels/val
labels/test
```

Each label file should use normalized YOLO coordinates:

```text
class_id x_center y_center width height
```

The MVP classes are defined in `data.yaml`.

## Train

```bash
python app/training/train_yolo.py --model yolo11n.pt --data app/training/data.yaml --epochs 50 --imgsz 640 --batch 16
```

## Export

```bash
python app/training/export_model.py --model runs/detect/train/weights/best.pt --output app/models/defect-yolo.pt
```

## Evaluate

```bash
python app/training/evaluate_yolo.py --model app/models/defect-yolo.pt --data app/training/data.yaml
```

Before commercial use, verify the license terms for Ultralytics, pretrained weights, and all training datasets.
