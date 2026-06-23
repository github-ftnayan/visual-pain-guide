"use client";
import { useState } from "react";

interface BodyMapProps {
  selectedMuscleId: string | null;
  onMuscleSelect: (muscleId: string) => void;
}

interface MuscleRegion {
  id: string;
  label: string;
  shape: "ellipse" | "rect";
  cx?: number; cy?: number; rx?: number; ry?: number;
  x?: number; y?: number; w?: number; h?: number; r?: number;
}

const FRONT_MUSCLES: MuscleRegion[] = [
  { id: "cervical_spine",  label: "Neck",          shape: "ellipse", cx: 100, cy: 67,  rx: 11, ry: 8  },
  { id: "trapezius_spine", label: "Upper Trap",    shape: "ellipse", cx: 100, cy: 94,  rx: 38, ry: 11 },
  { id: "shoulder",        label: "Shoulder",      shape: "ellipse", cx: 51,  cy: 108, rx: 16, ry: 13 },
  { id: "shoulder",        label: "Shoulder",      shape: "ellipse", cx: 149, cy: 108, rx: 16, ry: 13 },
  { id: "hip_flexors",     label: "Hip Flexors",   shape: "ellipse", cx: 100, cy: 218, rx: 26, ry: 11 },
  { id: "quadriceps",      label: "Quadriceps",    shape: "rect",    x: 65,  y: 232, w: 28, h: 92, r: 10 },
  { id: "quadriceps",      label: "Quadriceps",    shape: "rect",    x: 107, y: 232, w: 28, h: 92, r: 10 },
  { id: "IT_band",         label: "IT Band",       shape: "rect",    x: 63,  y: 232, w: 8,  h: 92, r: 4  },
  { id: "IT_band",         label: "IT Band",       shape: "rect",    x: 129, y: 232, w: 8,  h: 92, r: 4  },
  { id: "calves",          label: "Calves",        shape: "rect",    x: 66,  y: 338, w: 24, h: 84, r: 10 },
  { id: "calves",          label: "Calves",        shape: "rect",    x: 110, y: 338, w: 24, h: 84, r: 10 },
];

const BACK_MUSCLES: MuscleRegion[] = [
  { id: "trapezius_spine", label: "Upper Trap",    shape: "ellipse", cx: 100, cy: 95,  rx: 40, ry: 13 },
  { id: "shoulder",        label: "Shoulder",      shape: "ellipse", cx: 50,  cy: 107, rx: 16, ry: 13 },
  { id: "shoulder",        label: "Shoulder",      shape: "ellipse", cx: 150, cy: 107, rx: 16, ry: 13 },
  { id: "lumbar_spine",    label: "Lower Back",    shape: "rect",    x: 72,  y: 155, w: 56, h: 38, r: 8  },
  { id: "glutes",          label: "Glutes",        shape: "ellipse", cx: 100, cy: 224, rx: 34, ry: 17 },
  { id: "hamstrings",      label: "Hamstrings",    shape: "rect",    x: 65,  y: 242, w: 28, h: 90, r: 10 },
  { id: "hamstrings",      label: "Hamstrings",    shape: "rect",    x: 107, y: 242, w: 28, h: 90, r: 10 },
  { id: "IT_band",         label: "IT Band",       shape: "rect",    x: 63,  y: 242, w: 8,  h: 90, r: 4  },
  { id: "IT_band",         label: "IT Band",       shape: "rect",    x: 129, y: 242, w: 8,  h: 90, r: 4  },
  { id: "calves",          label: "Calves",        shape: "rect",    x: 66,  y: 342, w: 24, h: 82, r: 10 },
  { id: "calves",          label: "Calves",        shape: "rect",    x: 110, y: 342, w: 24, h: 82, r: 10 },
];

export default function BodyMap({ selectedMuscleId, onMuscleSelect }: BodyMapProps) {
  const [view, setView] = useState<"front" | "back">("front");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const muscles = view === "front" ? FRONT_MUSCLES : BACK_MUSCLES;

  const getFill    = (id: string) => selectedMuscleId === id ? "#0d9488" : hoveredId === id ? "#2dd4bf" : "#64748b";
  const getOpacity = (id: string) => selectedMuscleId === id ? 0.9        : hoveredId === id ? 0.65      : 0.3;

  const renderMuscle = (m: MuscleRegion, i: number) => {
    const shared = {
      key: `${m.id}-${i}`,
      fill: getFill(m.id),
      opacity: getOpacity(m.id),
      style: { cursor: "pointer" } as React.CSSProperties,
      onClick: () => onMuscleSelect(m.id),
      onMouseEnter: () => setHoveredId(m.id),
      onMouseLeave: () => setHoveredId(null),
      role: "button" as const,
      "aria-label": m.label,
      "aria-pressed": selectedMuscleId === m.id,
    };
    return m.shape === "ellipse"
      ? <ellipse {...shared} cx={m.cx} cy={m.cy} rx={m.rx} ry={m.ry} />
      : <rect    {...shared} x={m.x}  y={m.y}  width={m.w} height={m.h} rx={m.r} />;
  };

  const hoveredLabel  = hoveredId        ? muscles.find(m => m.id === hoveredId)?.label        : null;
  const selectedLabel = selectedMuscleId ? muscles.find(m => m.id === selectedMuscleId)?.label : null;
  const selectedInView = selectedMuscleId ? muscles.some(m => m.id === selectedMuscleId) : true;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* View toggle */}
      <div className="flex rounded-lg border border-slate-700 overflow-hidden text-xs font-medium">
        {(["front", "back"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-1.5 transition-colors capitalize ${
              view === v
                ? "bg-slate-700 text-white"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            {v === "front" ? "Anterior" : "Posterior"}
          </button>
        ))}
      </div>

      {/* SVG body */}
      <div className="relative pb-6">
        <svg
          viewBox="0 0 200 452"
          className="w-40 lg:w-48 h-auto select-none"
          aria-label={`${view === "front" ? "Anterior" : "Posterior"} body map`}
        >
          {/* Silhouette */}
          <g fill="#1e293b">
            <circle cx="100" cy="34" r="24" />
            <rect x="93" y="57" width="14" height="20" rx="4" />
            {view === "front"
              ? <path d="M 58 76 L 142 76 L 148 112 L 52 112 Z" />
              : <path d="M 54 76 L 146 76 L 150 112 L 50 112 Z" />
            }
            {/* Arms */}
            <rect x="42"  y="80"  width="18" height="80" rx="9" />
            <rect x="140" y="80"  width="18" height="80" rx="9" />
            <rect x="44"  y="162" width="15" height="65" rx="7" />
            <rect x="141" y="162" width="15" height="65" rx="7" />
            {/* Torso */}
            <rect x="68" y="111" width="64" height="98" rx="6" />
            <path d="M 62 208 L 138 208 L 140 232 L 60 232 Z" />
            {/* Legs */}
            <rect x="63"  y="230" width="32" height="108" rx="13" />
            <rect x="105" y="230" width="32" height="108" rx="13" />
            <rect x="65"  y="340" width="27" height="94"  rx="11" />
            <rect x="108" y="340" width="27" height="94"  rx="11" />
            <rect x="62"  y="434" width="32" height="14"  rx="6"  />
            <rect x="106" y="434" width="32" height="14"  rx="6"  />
          </g>

          {/* Clickable muscle regions */}
          {muscles.map(renderMuscle)}
        </svg>

        {/* Hover tooltip */}
        <div className="absolute bottom-0 inset-x-0 text-center h-5 pointer-events-none">
          {hoveredLabel && (
            <span className="text-xs text-teal-400 font-medium">{hoveredLabel}</span>
          )}
        </div>
      </div>

      {/* Selection status */}
      <div className="text-xs text-center min-h-[16px]">
        {selectedMuscleId && selectedLabel && (
          <span className="text-teal-300 font-medium">{selectedLabel}</span>
        )}
        {selectedMuscleId && !selectedInView && (
          <span className="text-slate-500">
            Switch to {view === "front" ? "posterior" : "anterior"} view to see this muscle
          </span>
        )}
      </div>
    </div>
  );
}
