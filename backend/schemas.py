from pydantic import BaseModel, Field
from typing import List, Literal


class TriageRequest(BaseModel):
    muscle_id: str
    symptom_text: str


class TriageAnalysis(BaseModel):
    safety_status: Literal["SAFE", "RED_FLAG"] = Field(
        description="SAFE for muscle tightness/overuse/posture; RED_FLAG for neurological symptoms, acute trauma, or structural injury."
    )
    perceived_mechanism: str = Field(
        description="Brief clinical explanation of the likely pain mechanism (1-2 sentences)."
    )
    linguistic_justification: str = Field(
        description="Exactly which words or phrases led to this classification."
    )
    remediation_tags: List[str] = Field(
        description="4-8 exercise/therapy tags from the allowed vocabulary. Empty list if RED_FLAG."
    )
    empathetic_response: str = Field(
        description="Warm, professional message to the patient. Non-diagnostic."
    )


class VideoMatch(BaseModel):
    id: str
    title: str
    creator: str
    youtube_id: str
    start_time: int
    tags: List[str]


class TriageResponse(BaseModel):
    analysis: TriageAnalysis
    videos: List[VideoMatch]
