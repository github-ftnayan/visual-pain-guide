import json
import os
from typing import List, Optional
from schemas import VideoMatch

_DB_PATH = os.path.join(os.path.dirname(__file__), "data", "videos.json")
_db: Optional[dict] = None


def _load_db() -> dict:
    global _db
    if _db is None:
        with open(_DB_PATH) as f:
            _db = json.load(f)
    return _db


def match_videos(muscle_id: str, remediation_tags: List[str]) -> List[VideoMatch]:
    db = _load_db()
    candidates = db.get(muscle_id, [])
    if not candidates:
        return []

    tag_set = set(t.lower().strip() for t in remediation_tags)
    scored = sorted(
        [(len(set(v["tags"]) & tag_set), v) for v in candidates],
        key=lambda x: x[0],
        reverse=True,
    )
    return [VideoMatch(**v) for _, v in scored[:2]]
