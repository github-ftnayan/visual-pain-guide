"use client";

interface MuscleSelectorProps {
  selectedMuscleId: string | null;
  onMuscleSelect: (muscleId: string) => void;
}

const MUSCLE_GROUPS = [
  {
    region: "Upper Body",
    muscles: [
      { id: "cervical_spine", label: "Neck", sublabel: "Cervical Spine" },
      { id: "trapezius_spine", label: "Upper Trapezius", sublabel: "Upper Back / Neck" },
      { id: "shoulder", label: "Shoulder", sublabel: "Rotator Cuff / Deltoid" },
    ],
  },
  {
    region: "Core & Back",
    muscles: [
      { id: "lumbar_spine", label: "Lower Back", sublabel: "Lumbar Spine" },
      { id: "hip_flexors", label: "Hip Flexors", sublabel: "Psoas / Iliacus" },
    ],
  },
  {
    region: "Lower Body",
    muscles: [
      { id: "glutes", label: "Glutes", sublabel: "Gluteus Maximus / Medius" },
      { id: "quadriceps", label: "Quadriceps", sublabel: "Front of Thigh" },
      { id: "hamstrings", label: "Hamstrings", sublabel: "Back of Thigh" },
      { id: "IT_band", label: "IT Band", sublabel: "Lateral Thigh / Knee" },
      { id: "calves", label: "Calves", sublabel: "Gastrocnemius / Soleus" },
    ],
  },
];

export default function MuscleSelector({
  selectedMuscleId,
  onMuscleSelect,
}: MuscleSelectorProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-base font-semibold text-slate-200">Where does it hurt?</h2>
        <p className="text-slate-500 text-xs mt-0.5">Select a muscle group below</p>
      </div>

      {MUSCLE_GROUPS.map(({ region, muscles }) => (
        <div key={region}>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
            {region}
          </p>
          <div className="flex flex-col gap-1.5">
            {muscles.map(({ id, label, sublabel }) => {
              const isSelected = selectedMuscleId === id;
              return (
                <button
                  key={id}
                  onClick={() => onMuscleSelect(id)}
                  aria-pressed={isSelected}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                    isSelected
                      ? "bg-teal-600 border-teal-400 text-white shadow-lg shadow-teal-900/30"
                      : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-500"
                  }`}
                >
                  <span className="block font-medium text-sm">{label}</span>
                  <span
                    className={`block text-xs mt-0.5 ${
                      isSelected ? "text-teal-200" : "text-slate-500"
                    }`}
                  >
                    {sublabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
