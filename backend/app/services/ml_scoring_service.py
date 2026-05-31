from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Any

import joblib
from sklearn.ensemble import RandomForestRegressor

from app.ml.feature_vectorizer import (
    CATEGORY_SCORE_KEYS,
    FEATURE_VECTOR_NAMES,
    SCORE_KEYS,
    clamp_score,
    features_to_vector,
    scores_to_target,
    target_to_scores,
)


TRAINING_DATA_FILE = Path("storage/training_data.json")
MODEL_FILE = Path("storage/models/repolens_repo_model.joblib")
MODEL_META_FILE = Path("storage/models/repolens_repo_model_meta.json")

MODEL_VERSION = "repolens-random-forest-v1"
MIN_TRAINING_ROWS = 5
MAX_TRAINING_ROWS = 5000
ML_WEIGHT = 0.35

FEEDBACK_DATA_FILE = Path("storage/feedback_labels.json")
FEEDBACK_REPEAT = 4


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _read_training_data() -> list[dict[str, Any]]:
    if not TRAINING_DATA_FILE.exists():
        return []

    try:
        with TRAINING_DATA_FILE.open("r", encoding="utf-8") as file:
            data = json.load(file)

        if isinstance(data, list):
            return data

        return []

    except Exception:
        return []


def _write_training_data(records: list[dict[str, Any]]) -> None:
    TRAINING_DATA_FILE.parent.mkdir(parents=True, exist_ok=True)

    with TRAINING_DATA_FILE.open("w", encoding="utf-8") as file:
        json.dump(records, file, indent=2)


def _write_meta(meta: dict[str, Any]) -> None:
    MODEL_META_FILE.parent.mkdir(parents=True, exist_ok=True)

    with MODEL_META_FILE.open("w", encoding="utf-8") as file:
        json.dump(meta, file, indent=2)


def _read_meta() -> dict[str, Any] | None:
    if not MODEL_META_FILE.exists():
        return None

    try:
        with MODEL_META_FILE.open("r", encoding="utf-8") as file:
            return json.load(file)
    except Exception:
        return None


def get_model_status() -> dict[str, Any]:
    records = _read_training_data()
    feedback_records = _read_feedback_data()
    meta = _read_meta()

    return {
        "model_exists": MODEL_FILE.exists(),
        "model_version": MODEL_VERSION,
        "training_rows": len(records),
        "minimum_training_rows": MIN_TRAINING_ROWS,
        "is_trained": MODEL_FILE.exists(),
        "meta": meta,
        "feedback_rows": len(feedback_records),
    }


def save_training_example(analysis: dict[str, Any]) -> dict[str, Any]:
    repository = analysis.get("repository") or {}
    features = analysis.get("features") or {}
    scores = analysis.get("scores") or {}

    if not features or not scores:
        return get_model_status()

    record = {
        "repo_url": repository.get("url"),
        "full_name": repository.get("full_name"),
        "features": features,
        "labels": {
            key: scores.get(key, 0)
            for key in SCORE_KEYS
        },
        "label_source": "weak_rule_score_v1",
        "created_at": _now(),
    }

    records = _read_training_data()
    records.append(record)

    if len(records) > MAX_TRAINING_ROWS:
        records = records[-MAX_TRAINING_ROWS:]

    _write_training_data(records)

    if len(records) >= MIN_TRAINING_ROWS:
        train_repo_model(force=True)

    return get_model_status()


def train_repo_model(force: bool = False) -> dict[str, Any]:
    records = _read_training_data()

    valid_records = []

    for record in records:
        features = record.get("features")
        labels = record.get("labels")

        if not isinstance(features, dict) or not isinstance(labels, dict):
            continue

        valid_records.append(record)

    if len(valid_records) < MIN_TRAINING_ROWS:
        return {
            "trained": False,
            "reason": "not_enough_training_data",
            "training_rows": len(valid_records),
            "minimum_training_rows": MIN_TRAINING_ROWS,
        }

    x_train = [
        features_to_vector(record["features"])
        for record in valid_records
    ]

    y_train = [
        scores_to_target(record["labels"])
        for record in valid_records
    ]

    model = RandomForestRegressor(
        n_estimators=120,
        random_state=42,
        min_samples_leaf=1,
    )

    model.fit(x_train, y_train)

    MODEL_FILE.parent.mkdir(parents=True, exist_ok=True)

    joblib.dump(
        {
            "model": model,
            "model_version": MODEL_VERSION,
            "feature_vector_names": FEATURE_VECTOR_NAMES,
            "score_keys": SCORE_KEYS,
            "trained_at": _now(),
            "training_rows": len(valid_records),
        },
        MODEL_FILE,
    )

    meta = {
        "model_version": MODEL_VERSION,
        "trained_at": _now(),
        "training_rows": len(valid_records),
        "feature_count": len(FEATURE_VECTOR_NAMES),
        "score_keys": SCORE_KEYS,
        "model_type": "RandomForestRegressor",
        "label_source": "weak_rule_score_v1",
    }

    _write_meta(meta)

    return {
        "trained": True,
        **meta,
    }


def predict_ml_scores(features: dict[str, Any]) -> dict[str, int] | None:
    if not MODEL_FILE.exists():
        return None

    try:
        bundle = joblib.load(MODEL_FILE)
        model = bundle["model"]

        vector = [features_to_vector(features)]
        prediction = model.predict(vector)[0]

        return target_to_scores(list(prediction))

    except Exception:
        return None


def _badge_from_score(overall: int) -> str:
    if overall >= 85:
        return "Excellent"
    if overall >= 70:
        return "Recruiter Ready"
    if overall >= 50:
        return "Needs Improvement"
    return "Weak Presentation"

def get_dynamic_ml_weight() -> float:
    try:
        feedback_count = len(_read_feedback_data())
    except Exception:
        feedback_count = 0

    if feedback_count >= 100:
        return 0.70

    if feedback_count >= 50:
        return 0.55

    if feedback_count >= 20:
        return 0.45

    return 0.35

def blend_rule_and_ml_scores(
    rule_scores: dict[str, Any],
    ml_scores: dict[str, int] | None,
) -> dict[str, Any]:
    if not ml_scores:
        result = dict(rule_scores)
        result["ml_model_used"] = False
        result["score_source"] = "rule_engine"
        result["ml_weight"] = 0.0
        return result

    ml_weight = get_dynamic_ml_weight()

    blended = {}

    for key in SCORE_KEYS:
        rule_value = rule_scores.get(key, 0)
        ml_value = ml_scores.get(key, 0)

        blended[key] = clamp_score(
            (float(rule_value) * (1 - ml_weight))
            + (float(ml_value) * ml_weight)
        )

    category_values = {
        key: blended[key]
        for key in CATEGORY_SCORE_KEYS
    }

    strongest_category = max(category_values, key=category_values.get)
    weakest_category = min(category_values, key=category_values.get)

    blended["strongest_category"] = strongest_category
    blended["weakest_category"] = weakest_category
    blended["badge"] = _badge_from_score(blended["overall"])

    blended["ml_model_used"] = True
    blended["score_source"] = "hybrid_rule_ml"
    blended["ml_weight"] = ml_weight
    blended["model_version"] = MODEL_VERSION
    blended["rule_based_overall"] = rule_scores.get("overall", 0)
    blended["ml_based_overall"] = ml_scores.get("overall", 0)

    return blended

def _read_feedback_data() -> list[dict[str, Any]]:
    if not FEEDBACK_DATA_FILE.exists():
        return []

    try:
        with FEEDBACK_DATA_FILE.open("r", encoding="utf-8") as file:
            data = json.load(file)

        if isinstance(data, list):
            return data

        return []

    except Exception:
        return []


def _write_feedback_data(records: list[dict[str, Any]]) -> None:
    FEEDBACK_DATA_FILE.parent.mkdir(parents=True, exist_ok=True)

    with FEEDBACK_DATA_FILE.open("w", encoding="utf-8") as file:
        json.dump(records, file, indent=2)


def _quality_to_score(quality_label: str) -> int:
    mapping = {
        "strong": 85,
        "average": 60,
        "weak": 35,
    }

    return mapping.get(quality_label, 60)


def _score_feedback_adjustment(score_feedback: str) -> int:
    mapping = {
        "accurate": 0,
        "too_high": -12,
        "too_low": 12,
    }

    return mapping.get(score_feedback, 0)


def _build_feedback_labels(
    current_scores: dict[str, Any],
    quality_label: str,
    score_feedback: str,
) -> dict[str, int]:
    current_overall = float(current_scores.get("overall", 0))

    quality_score = _quality_to_score(quality_label)
    adjustment = _score_feedback_adjustment(score_feedback)

    target_overall = clamp_score(quality_score + adjustment)

    if score_feedback == "accurate":
        target_overall = clamp_score((target_overall + current_overall) / 2)

    delta = target_overall - current_overall

    labels = {}

    for key in SCORE_KEYS:
        if key == "overall":
            labels[key] = target_overall
        else:
            current_value = float(current_scores.get(key, 0))
            labels[key] = clamp_score(current_value + (delta * 0.6))

    return labels


def save_user_feedback_example(
    repository: dict[str, Any],
    features: dict[str, Any],
    scores: dict[str, Any],
    quality_label: str,
    score_feedback: str,
    comment: str | None = None,
) -> dict[str, Any]:
    feedback_record = {
        "repo_url": repository.get("url"),
        "full_name": repository.get("full_name"),
        "quality_label": quality_label,
        "score_feedback": score_feedback,
        "comment": comment,
        "scores_at_feedback_time": scores,
        "created_at": _now(),
    }

    feedback_records = _read_feedback_data()
    feedback_records.append(feedback_record)
    _write_feedback_data(feedback_records)

    labels = _build_feedback_labels(
        current_scores=scores,
        quality_label=quality_label,
        score_feedback=score_feedback,
    )

    training_record = {
        "repo_url": repository.get("url"),
        "full_name": repository.get("full_name"),
        "features": features,
        "labels": labels,
        "label_source": "user_feedback_v1",
        "feedback": feedback_record,
        "created_at": _now(),
    }

    training_records = _read_training_data()

    for repeat_index in range(FEEDBACK_REPEAT):
        repeated_record = dict(training_record)
        repeated_record["feedback_repeat_index"] = repeat_index
        training_records.append(repeated_record)

    if len(training_records) > MAX_TRAINING_ROWS:
        training_records = training_records[-MAX_TRAINING_ROWS:]

    _write_training_data(training_records)

    train_repo_model(force=True)

    return get_model_status()