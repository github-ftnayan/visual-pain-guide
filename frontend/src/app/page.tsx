"use client";
import { useState } from "react";
import { AppState, TriageResponse } from "@/types";
import BodyMap from "@/components/BodyMap";
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
        const body = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(body.detail ?? body.error ?? `Server error ${res.status}`);
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
    <main className="flex flex-col items-center min-h-screen px-4 py-8 gap-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-teal-400">Visual Pain Guide</h1>
        <p className="text-slate-400 text-sm mt-1">
          Select a muscle group, describe your symptoms, receive evidence-based PT video recommendations.
        </p>
      </div>

      {/* Disclaimer banner */}
      <div className="w-full max-w-5xl bg-amber-950 border border-amber-700 rounded-lg px-4 py-2 text-xs text-amber-300 text-center">
        For educational purposes only. This is not medical advice. Always consult a licensed healthcare professional.
      </div>

      {/* Main layout */}
      <div className="flex flex-col lg:flex-row gap-8 w-full max-w-5xl items-start justify-center">
        {/* Body map */}
        <div className="flex-shrink-0 lg:sticky lg:top-8">
          <BodyMap selectedMuscleId={selectedMuscle} onMuscleSelect={handleMuscleSelect} />
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-4 flex-1 min-w-0 w-full">
          {appState === "IDLE" && (
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 text-slate-400 text-sm text-center">
              Click a muscle group on the diagram or select one from the labels to begin.
            </div>
          )}

          {(appState === "MUSCLE_SELECTED" || appState === "LOADING") && selectedMuscle && (
            <SymptomPanel
              muscleId={selectedMuscle}
              onSubmit={handleSubmit}
              isLoading={appState === "LOADING"}
            />
          )}

          {error && (
            <div className="bg-red-950 border border-red-700 rounded-lg px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {appState === "RESULT_SAFE" && result && (
            <div className="flex flex-col gap-4">
              <div className="bg-teal-950 border border-teal-700 rounded-xl p-4">
                <p className="text-teal-300 font-medium leading-relaxed">
                  {result.analysis.empathetic_response}
                </p>
                <p className="text-slate-400 text-xs mt-3">
                  <span className="font-semibold text-slate-300">Likely mechanism: </span>
                  {result.analysis.perceived_mechanism}
                </p>
                {result.analysis.remediation_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {result.analysis.remediation_tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-teal-900 text-teal-300 border border-teal-700 px-2 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {result.videos.map((video) => (
                <VideoPlayer key={video.id} video={video} />
              ))}

              <button
                onClick={handleReset}
                className="text-slate-500 text-sm underline hover:text-slate-300 self-start"
              >
                Start over
              </button>
            </div>
          )}

          {appState === "RESULT_RED_FLAG" && result && (
            <div className="flex flex-col gap-4">
              <SafetyCard message={result.analysis.empathetic_response} />
              <button
                onClick={handleReset}
                className="text-slate-500 text-sm underline hover:text-slate-300 self-start"
              >
                Start over
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
