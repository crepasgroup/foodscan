"use client";

interface NutrientRingProps {
  value: number;
  max: number;
  label: string;
  unit: string;
  color: string;
  size?: number;
}

export default function NutrientRing({
  value,
  max,
  label,
  unit,
  color,
  size = 72,
}: NutrientRingProps) {
  const r = (size - 10) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const offset = circumference * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth={8}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="text-center -mt-1">
        <p className="text-base font-bold text-gray-800 leading-tight">
          {value}
          <span className="text-xs font-normal text-gray-500">{unit}</span>
        </p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}
