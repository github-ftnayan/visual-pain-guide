import json
import os
from typing import List

from schemas import VideoMatch

_DB_PATH = os.path.join(os.path.dirname(__file__), "data", "videos.json")


def _load_db() -> dict:
    with open(_DB_PATH, encoding="utf-8") as f:
        return json.load(f)


def match_videos(muscle_id: str, remediation_tags: List[str]) -> List[VideoMatch]:
    """
    Score each video for the given muscle group by the number of tags that intersect
    with the LLM-generated remediation_tags. Returns top 2 by score.
    """
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
