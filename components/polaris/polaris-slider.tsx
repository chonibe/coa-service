"use client";

import React from "react";

export interface SliderProps {
  value?: number[];
  onValueChange?: (value: number[]) => void;
  defaultValue?: number[];
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  disabled?: boolean;
}

export const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ value, onValueChange, defaultValue = [0], min = 0, max = 100, step = 1, className = "", disabled = false }, ref) => {
    const [internalValue, setInternalValue] = React.useState(value || defaultValue);

    React.useEffect(() => {
      if (value) {
        setInternalValue(value);
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = [parseInt(e.target.value, 10)];
      setInternalValue(newValue);
      onValueChange?.(newValue);
    };

    return (
      <div ref={ref} className={`relative flex items-center ${className}`}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={internalValue[0]}
          onChange={handleChange}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
    );
  }
);

Slider.displayName = "Slider";
