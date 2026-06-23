"use client";
import { useState } from "react";

const MUSCLE_LABELS: Record<string, string> = {
  lumbar_spine: "Lower Back",
  trapezius_spine: "Upper Trapezius",
  hamstrings: "Hamstrings",
  quadriceps: "Quadriceps",
  glutes: "Glutes",
  cervical_spine: "Neck (Cervical)",
  calves: "Calves",
  shoulder: "Shoulder",
  hip_flexors: "Hip Flexors",
  IT_band: "IT Band",
};

interface SymptomPanelProps {
  muscleId: string;
  onSubmit: (symptomText: string) => void;
  isLoading: boolean;
}

export default function SymptomPanel({ muscleId, onSubmit, isLoading }: SymptomPanelProps) {
  const [text, setText] = useState("");
  const MIN_CHARS = 10;
  const canSubmit = text.trim().length >= MIN_CHARS && !isLoading;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 flex flex-col gap-3 shadow-lg">
      <div>
        <h2 className="text-lg font-semibold text-teal-400">
          {MUSCLE_LABELS[muscleId] ?? muscleId}
        </h2>
        <p className="text-slate-400 text-sm mt-0.5">Describe what you're feeling in this area</p>
      </div>
      <textarea
        className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-slate-100
                   placeholder-slate-500 resize-none focus:outline-none focus:ring-2
                   focus:ring-teal-500 text-sm h-28"
        placeholder="e.g. Dull aching after sitting for long periods, stiff in the morning..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isLoading}
        aria-label="Symptom description"
      />
      <div className="flex items-center justify-between">
        <span className="text-slate-500 text-xs">
          {text.length} chars (min {MIN_CHARS})
        </span>
        <button
          onClick={() => onSubmit(text)}
          disabled={!canSubmit}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            canSubmit
              ? "bg-teal-600 hover:bg-teal-500 text-white"
              : "bg-slate-700 text-slate-500 cursor-not-allowed"
          }`}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              Analyzing...
            </span>
          ) : (
            "Get Recommendations"
          )}
        </button>
      </div>
    </div>
  );
}
