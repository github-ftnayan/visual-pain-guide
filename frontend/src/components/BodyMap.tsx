"use client";
import { MuscleGroupDef } from "@/types";

const MUSCLE_GROUPS: MuscleGroupDef[] = [
  // --- Posterior chain (conceptually back, shown with offset fill) ---
  { id: "cervical_spine",  label: "Neck",          type: "ellipse", cx: 100, cy: 60,  rx: 13,  ry: 11  },
  { id: "trapezius_spine", label: "Upper Trap",    type: "ellipse", cx: 100, cy: 90,  rx: 38,  ry: 11  },
  { id: "shoulder",        label: "Shoulder",      type: "ellipse", cx: 63,  cy: 110, rx: 15,  ry: 12  },
  { id: "lumbar_spine",    label: "Lower Back",    type: "rect",    x: 80,   y: 188,  width: 40, height: 34 },
  { id: "glutes",          label: "Glutes",        type: "ellipse", cx: 100, cy: 250, rx: 26,  ry: 14  },
  { id: "hip_flexors",     label: "Hip Flexors",   type: "ellipse", cx: 100, cy: 232, rx: 16,  ry: 10  },
  { id: "quadriceps",      label: "Quadriceps",    type: "rect",    x: 85,   y: 272,  width: 30, height: 52 },
  { id: "hamstrings",      label: "Hamstrings",    type: "rect",    x: 60,   y: 272,  width: 22, height: 52 },
  { id: "IT_band",         label: "IT Band",       type: "rect",    x: 118,  y: 272,  width: 18, height: 52 },
  { id: "calves",          label: "Calves",        type: "rect",    x: 80,   y: 340,  width: 40, height: 44 },
];

interface BodyMapProps {
  selectedMuscleId: string | null;
  onMuscleSelect: (muscleId: string) => void;
}

export default function BodyMap({ selectedMuscleId, onMuscleSelect }: BodyMapProps) {
  return (
    <div className="flex flex-col items-center gap-4 select-none">
      <h2 className="text-slate-300 font-medium text-sm tracking-wide uppercase">
        Select a muscle group
      </h2>

      <svg
        viewBox="0 0 200 420"
        className="w-44 lg:w-52 h-auto drop-shadow-md"
        aria-label="Human body diagram — click a muscle group"
      >
        {/* ── Body silhouette ── */}
        {/* Head */}
        <ellipse cx="100" cy="36" rx="22" ry="22" fill="#1e293b" />
        {/* Neck */}
        <rect x="92" y="57" width="16" height="12" fill="#1e293b" />
        {/* Torso */}
        <rect x="70" y="68" width="60" height="130" rx="6" fill="#1e293b" />
        {/* Left arm */}
        <rect x="38" y="72" width="28" height="95" rx="10" fill="#1e293b" />
        {/* Right arm */}
        <rect x="134" y="72" width="28" height="95" rx="10" fill="#1e293b" />
        {/* Left leg */}
        <rect x="72" y="196" width="24" height="155" rx="8" fill="#1e293b" />
        {/* Right leg */}
        <rect x="104" y="196" width="24" height="155" rx="8" fill="#1e293b" />

        {/* ── Muscle group overlays ── */}
        {MUSCLE_GROUPS.map((mg) => {
          const isSelected = selectedMuscleId === mg.id;
          const fill = isSelected ? "#2dd4bf" : "#475569";
          const stroke = isSelected ? "#0d9488" : "#64748b";
          const opacity = isSelected ? 0.9 : 0.65;

          const shared = {
            key: mg.id,
            fill,
            stroke,
            strokeWidth: isSelected ? 2 : 1,
            opacity,
            style: { cursor: "pointer" },
            onClick: () => onMuscleSelect(mg.id),
            "data-muscle-id": mg.id,
            role: "button" as const,
            "aria-label": mg.label,
            "aria-pressed": isSelected,
          };

          if (mg.type === "ellipse") {
            return <ellipse {...shared} cx={mg.cx} cy={mg.cy} rx={mg.rx} ry={mg.ry} />;
          }
          return (
            <rect {...shared} x={mg.x} y={mg.y} width={mg.width} height={mg.height} rx={4} />
          );
        })}
      </svg>

      {/* Legend pills — accessible fallback and labels */}
      <div className="flex flex-wrap gap-1.5 justify-center max-w-[220px]">
        {MUSCLE_GROUPS.map((mg) => (
          <button
            key={mg.id}
            onClick={() => onMuscleSelect(mg.id)}
            className={`text-xs px-2.5 py-0.5 rounded-full border transition-colors ${
              selectedMuscleId === mg.id
                ? "bg-teal-500 border-teal-400 text-white"
                : "bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500"
            }`}
          >
            {mg.label}
          </button>
        ))}
      </div>
    </div>
  );
}
