import React from 'react';

interface RangeControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (val: number) => void;
}

export const RangeControl: React.FC<RangeControlProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange
}) => {
  return (
    <div className="flex flex-col gap-2 p-4 rounded-[1rem] bg-[#111a2c] border border-[#29364d]">
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium text-[#f3f6fc]">{label}</span>
        <span className="font-mono text-[#53d8e8]">{value} {unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        aria-label={label}
        className="w-full accent-[#53d8e8] cursor-pointer bg-[#29364d] rounded-lg h-2"
      />
    </div>
  );
};
