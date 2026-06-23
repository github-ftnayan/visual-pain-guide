"use client";
import { useState } from "react";
import { AppState, TriageResponse } from "@/types";
import MuscleSelector from "@/components/MuscleSelector";
import SymptomPanel from "@/components/SymptomPanel";
import VideoPlayer from "@/components/VideoPlayer";
import SafetyCard from "@/components/SafetyCard";

export default function Home() {
  const [appState, setAppState] = useState<AppState>("IDLE");
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [result, setResult] = useState<TriageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMuscleSelect = (muscleId: string) => {
    setSelectedMuscle(muscleId);
    setResult(null);
    setError(null);
    setAppState("MUSCLE_SELECTED");
  };

  const handleSubmit = async (symptomText: string) => {
    if (!selectedMuscle) return;
    setAppState("LOADING");
    setError(null);
    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ muscle_id: selectedMuscle, symptom_text: symptomText }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Server error" }));
        throw new Error(err.detail ?? err.error ?? `Error ${res.status}`);
      }
      const data: TriageResponse = await res.json();
      setResult(data);
      setAppState(data.analysis.safety_status === "SAFE" ? "RESULT_SAFE" : "RESULT_RED_FLAG");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "An unexpected error occurred.");
      setAppState("MUSCLE_SELECTED");
    }
  };

  const handleReset = () => {
    setAppState("IDLE");
    setSelectedMuscle(null);
    setResult(null);
    setError(null);
  };

  return (
    <main className="min-h-screen p-6 lg:p-10">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-teal-400 tracking-tight">Visual Pain Guide</h1>
          <p className="text-slate-400 text-sm mt-1">
            Select a muscle group, describe your symptoms, and get targeted PT video recommendations.
          </p>
        </header>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="w-full lg:w-64 flex-shrink-0">
            <MuscleSelector
              selectedMuscleId={selectedMuscle}
              onMuscleSelect={handleMuscleSelect}
            />
          </div>

          <div className="flex-1 flex flex-col gap-4 min-w-0">
            {(appState === "MUSCLE_SELECTED" || appState === "LOADING") && (
              <SymptomPanel
                muscleId={selectedMuscle!}
                onSubmit={handleSubmit}
                isLoading={appState === "LOADING"}
              />
            )}

            {error && (
              <div className="bg-red-950 border border-red-700 rounded-lg p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {appState === "RESULT_SAFE" && result && (
              <>
                <div className="bg-teal-950/60 border border-teal-800 rounded-xl p-4">
                  <p className="text-teal-300 text-sm leading-relaxed">
                    {result.analysis.empathetic_response}
                  </p>
                  <p className="text-slate-500 text-xs mt-2">
                    <span className="text-slate-400 font-medium">Mechanism: </span>
                    {result.analysis.perceived_mechanism}
                  </p>
                </div>
                {result.videos.map((video) => (
                  <VideoPlayer key={video.id} video={video} />
                ))}
                <button
                  onClick={handleReset}
                  className="text-slate-500 text-xs underline hover:text-slate-300 self-start"
                >
                  ← Start over
                </button>
              </>
            )}

            {appState === "RESULT_RED_FLAG" && result && (
              <>
                <SafetyCard message={result.analysis.empathetic_response} />
                <button
                  onClick={handleReset}
                  className="text-slate-500 text-xs underline hover:text-slate-300 self-start"
                >
                  ← Start over
                </button>
              </>
            )}

            {appState === "IDLE" && (
              <div className="flex items-center justify-center min-h-64">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-slate-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <p className="text-slate-500 text-sm">Select a muscle group to get started</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="mt-12 pt-6 border-t border-slate-800">
          <p className="text-slate-600 text-xs text-center">
            This tool does not provide medical advice. Always consult a licensed healthcare provider for diagnosis and treatment.
          </p>
        </footer>
      </div>
    </main>
  );
}
