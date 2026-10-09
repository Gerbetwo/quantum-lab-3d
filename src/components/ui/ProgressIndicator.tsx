import React from 'react';

interface ProgressIndicatorProps {
  value: number; // 0 to 100
  label?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ value, label }) => {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <div className="flex justify-between text-xs text-[#a6b2c6]">
          <span>{label}</span>
          <span>{Math.round(clamped)}%</span>
        </div>
      )}
      <div
        className="w-full bg-[#172238] rounded-full h-2 overflow-hidden border border-[#29364d]"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="bg-[#53d8e8] h-full transition-all duration-200"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
