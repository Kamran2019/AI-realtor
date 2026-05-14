CLASS_TO_DEFECT = {
    "crack": "crack",
    "damp": "damp",
    "mould": "mould",
    "mold": "mould",
    "peeling_paint": "peeling_paint",
    "water_seepage": "water_seepage",
    "stain": "stain",
    "wall_hole": "wall_hole",
    "tile_damage": "tile_damage",
    "poor_finish": "poor_finish",
}


def normalize_class_name(class_name: str) -> str:
    return class_name.strip().lower().replace(" ", "_").replace("-", "_")


def map_class_to_defect(class_name: str | None) -> str | None:
    if not class_name:
        return None

    return CLASS_TO_DEFECT.get(normalize_class_name(class_name))
