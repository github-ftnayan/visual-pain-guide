interface SafetyCardProps {
  message: string;
}

export default function SafetyCard({ message }: SafetyCardProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="bg-red-950 border-2 border-red-500 rounded-xl p-6 shadow-xl"
    >
      <div className="flex items-start gap-3">
        <svg
          className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
        <div>
          <h2 className="text-red-300 font-bold text-lg">Medical Attention Recommended</h2>
          <p className="text-red-200 mt-2 text-sm leading-relaxed">{message}</p>
          <p className="text-red-400 font-semibold mt-4 text-sm">
            Please consult a licensed physician, physiotherapist, or visit an emergency room
            before attempting any self-treatment.
          </p>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-red-900">
        <p className="text-red-600 text-xs">
          This application does not provide medical advice. In case of emergency, call 911.
        </p>
      </div>
    </div>
  );
}
