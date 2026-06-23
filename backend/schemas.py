from pydantic import BaseModel, Field
from typing import List, Literal


class TriageRequest(BaseModel):
    muscle_id: str
    symptom_text: str


class TriageAnalysis(BaseModel):
    safety_status: Literal["SAFE", "RED_FLAG"] = Field(
        description="RED_FLAG if the description hints at structural damage, acute injury, neural issues, or emergency symptoms."
    )
    perceived_mechanism: str = Field(
        description="Brief clinical explanation of the likely pain mechanism (1-2 sentences)."
    )
    linguistic_justification: str = Field(
        description="Which specific words or phrases from the description led to this classification."
    )
    remediation_tags: List[str] = Field(
        description="4-8 specific exercise/therapy tags for the targeted area. Empty list if RED_FLAG."
    )
    empathetic_response: str = Field(
        description="Warm, professional, non-diagnostic message to show the user."
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


class EmbedRequest(BaseModel):
    file_path: str = Field(
        description="Path to the PT knowledge text file, relative to the backend/ directory."
    )


class EmbedResponse(BaseModel):
    status: str
    chunks_stored: int
    collection: str
