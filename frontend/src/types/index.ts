export type SafetyStatus = "SAFE" | "RED_FLAG";

export interface TriageRequest {
  muscle_id: string;
  symptom_text: string;
}

export interface TriageAnalysis {
  safety_status: SafetyStatus;
  perceived_mechanism: string;
  linguistic_justification: string;
  remediation_tags: string[];
  empathetic_response: string;
}

export interface VideoMatch {
  id: string;
  title: string;
  creator: string;
  youtube_id: string;
  start_time: number;
  tags: string[];
}

export interface TriageResponse {
  analysis: TriageAnalysis;
  videos: VideoMatch[];
}

export type AppState =
  | "IDLE"
  | "MUSCLE_SELECTED"
  | "LOADING"
  | "RESULT_SAFE"
  | "RESULT_RED_FLAG";

export interface MuscleGroupDef {
  id: string;
  label: string;
  type: "ellipse" | "rect" | "path";
  // ellipse
  cx?: number;
  cy?: number;
  rx?: number;
  ry?: number;
  // rect
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}
