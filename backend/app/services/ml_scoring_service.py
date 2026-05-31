from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Any

import httpx
import joblib
from sklearn.ensemble import RandomForestRegressor

from app.core.config import get_settings
from app.db.database import execute, fetch_all, fetch_one
from app.ml.feature_vectorizer import (
    CATEGORY_SCORE_KEYS,
    FEATURE_VECTOR_NAMES,
    SCORE_KEYS,
    clamp_score,
    features_to_vector,
    scores_to_target,
    target_to_scores,
)


settings = get_settings()

MODEL_FILE = Path("storage/models/repolens_repo_model.joblib")
MODEL_META_FILE = Path("storage/models/repolens_repo_model_meta.json")

MODEL_OBJECT_PATH = "models/repolens_repo_model.joblib"
MODEL_META_OBJECT_PATH = "models/repolens_repo_model_meta.json"

MODEL_VERSION = "repolens-random-forest-v1"
MIN_TRAINING_ROWS = 5
MAX_TRAINING_ROWS = 5000
FEEDBACK_REPEAT = 4


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _storage_enabled() -> bool:
    return bool(
        settings.supabase_url
        and settings.supabase_service_role_key
        and settings.supabase_storage_bucket
    )


def _storage_url(object_path: str) -> str:
    return (
        f"{settings.supabase_url.rstrip('/')}"
        f"/storage/v1/object/{settings.supabase_storage_bucket}/{object_path}"
    )


def _storage_headers(content_type: str | None = None) -> dict[str, str]:
    headers = {
        "apikey": settings.supabase_service_role_key or "",
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "x-upsert": "true",
    }

    if content_type:
        headers["Content-Type"] = content_type

    return headers


def _upload_file_to_storage(local_path: Path, object_path: str, content_type: str) -> bool:
    if not _storage_enabled() or not local_path.exists():
        return False

    try:
        with local_path.open("rb") as file:
            response = httpx.post(
                _storage_url(object_path),
                headers=_storage_headers(content_type),
                content=file.read(),
                timeout=60,
            )

        return response.status_code < 400

    except Exception:
        return False


def _download_file_from_storage(object_path: str, local_path: Path) -> bool:
    if not _storage_enabled():
        return False

    try:
        response = httpx.get(
            _storage_url(object_path),
            headers=_storage_headers(),
            timeout=60,
        )

        if response.status_code >= 400:
            return False

        local_path.parent.mkdir(parents=True, exist_ok=True)
        local_path.write_bytes(response.content)

        return True

    except Exception:
        return False


def _ensure_model_local() -> bool:
    if MODEL_FILE.exists():
        return True

    return _download_file_from_storage(MODEL_OBJECT_PATH, MODEL_FILE)


def _write_meta(meta: dict[str, Any]) -> None:
    MODEL_META_FILE.parent.mkdir(parents=True, exist_ok=True)

    with MODEL_META_FILE.open("w", encoding="utf-8") as file:
        json.dump(meta, file, indent=2)

    _upload_file_to_storage(
        MODEL_META_FILE,
        MODEL_META_OBJECT_PATH,
        "application/json",
    )


def _read_meta() -> dict[str, Any] | None:
    if not MODEL_META_FILE.exists():
        _download_file_from_storage(MODEL_META_OBJECT_PATH, MODEL_META_FILE)

    if not MODEL_META_FILE.exists():
        return None

    try:
        with MODEL_META_FILE.open("r", encoding="utf-8") as file:
            return json.load(file)
    except Exception:
        return None


def _count_training_rows() -> int:
    row = fetch_one("SELECT COUNT(*) AS count FROM training_examples")

    return int(row["count"]) if row else 0


def _count_feedback_rows() -> int:
    row = fetch_one("SELECT COUNT(*) AS count FROM feedback_labels")

    return int(row["count"]) if row else 0


def _read_training_data() -> list[dict[str, Any]]:
    rows = fetch_all(
        """
        SELECT
            repo_url,
            full_name,
            features,
            labels,
            label_source,
            feedback,
            created_at
        FROM training_examples
        ORDER BY id DESC
        LIMIT :limit
        """,
        {"limit": MAX_TRAINING_ROWS},
    )

    rows.reverse()

    return rows


def _insert_training_record(record: dict[str, Any]) -> None:
    execute(
        """
        INSERT INTO training_examples (
            repo_url,
            full_name,
            features,
            labels,
            label_source,
            feedback,
            created_at
        )
        VALUES (
            :repo_url,
            :full_name,
            CAST(:features AS JSONB),
            CAST(:labels AS JSONB),
            :label_source,
            CAST(:feedback AS JSONB),
            NOW()
        )
        """,
        {
            "repo_url": record.get("repo_url"),
            "full_name": record.get("full_name"),
            "features": json.dumps(record.get("features") or {}),
            "labels": json.dumps(record.get("labels") or {}),
            "label_source": record.get("label_source"),
            "feedback": json.dumps(record.get("feedback")),
        },
    )


def get_model_status() -> dict[str, Any]:
    model_exists = _ensure_model_local()
    meta = _read_meta()

    return {
        "model_exists": model_exists,
        "model_version": MODEL_VERSION,
        "training_rows": _count_training_rows(),
        "feedback_rows": _count_feedback_rows(),
        "minimum_training_rows": MIN_TRAINING_ROWS,
        "is_trained": model_exists,
        "storage_enabled": _storage_enabled(),
        "meta": meta,
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

    _insert_training_record(record)

    if _count_training_rows() >= MIN_TRAINING_ROWS:
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

    _upload_file_to_storage(
        MODEL_FILE,
        MODEL_OBJECT_PATH,
        "application/octet-stream",
    )

    meta = {
        "model_version": MODEL_VERSION,
        "trained_at": _now(),
        "training_rows": len(valid_records),
        "feature_count": len(FEATURE_VECTOR_NAMES),
        "score_keys": SCORE_KEYS,
        "model_type": "RandomForestRegressor",
        "label_source": "weak_rule_score_v1 + user_feedback_v1",
        "storage_uploaded": _storage_enabled(),
    }

    _write_meta(meta)

    return {
        "trained": True,
        **meta,
    }


def predict_ml_scores(features: dict[str, Any]) -> dict[str, int] | None:
    if not _ensure_model_local():
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


def _read_feedback_data() -> list[dict[str, Any]]:
    return fetch_all(
        """
        SELECT
            repo_url,
            full_name,
            quality_label,
            score_feedback,
            comment,
            scores_at_feedback_time,
            created_at
        FROM feedback_labels
        ORDER BY id DESC
        LIMIT 5000
        """
    )


def get_dynamic_ml_weight() -> float:
    feedback_count = _count_feedback_rows()

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

    execute(
        """
        INSERT INTO feedback_labels (
            repo_url,
            full_name,
            quality_label,
            score_feedback,
            comment,
            scores_at_feedback_time,
            created_at
        )
        VALUES (
            :repo_url,
            :full_name,
            :quality_label,
            :score_feedback,
            :comment,
            CAST(:scores_at_feedback_time AS JSONB),
            NOW()
        )
        """,
        {
            "repo_url": feedback_record["repo_url"],
            "full_name": feedback_record["full_name"],
            "quality_label": feedback_record["quality_label"],
            "score_feedback": feedback_record["score_feedback"],
            "comment": feedback_record["comment"],
            "scores_at_feedback_time": json.dumps(scores),
        },
    )

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

    for repeat_index in range(FEEDBACK_REPEAT):
        repeated_record = dict(training_record)
        repeated_record["feedback_repeat_index"] = repeat_index
        _insert_training_record(repeated_record)

    train_repo_model(force=True)

    return get_model_status()