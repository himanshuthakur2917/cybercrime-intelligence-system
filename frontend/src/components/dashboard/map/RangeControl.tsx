"use client";

import React, { useState } from "react";

interface RangeControlProps {
  onRangeChange: (range: number, unit: "meters" | "km") => void;
  defaultRange?: number;
  defaultUnit?: "meters" | "km";
  className?: string;
}

export const RangeControl: React.FC<RangeControlProps> = ({
  onRangeChange,
  defaultRange = 5,
  defaultUnit = "km",
  className = "",
}) => {
  const [range, setRange] = useState(defaultRange);
  const [unit, setUnit] = useState<"meters" | "km">(defaultUnit);

  const handleRangeChange = (value: number) => {
    setRange(value);
    onRangeChange(value, unit);
  };

  const handleUnitChange = (newUnit: "meters" | "km") => {
    setUnit(newUnit);
    if (newUnit === "meters" && unit === "km") {
      const convertedRange = range * 1000;
      setRange(convertedRange);
      onRangeChange(convertedRange, newUnit);
    } else if (newUnit === "km" && unit === "meters") {
      const convertedRange = range / 1000;
      setRange(convertedRange);
      onRangeChange(convertedRange, newUnit);
    } else {
      onRangeChange(range, newUnit);
    }
  };

  const getSliderConfig = () => {
    if (unit === "meters") {
      return { min: 100, max: 50000, step: 100 };
    }
    return { min: 0.1, max: 50, step: 0.1 };
  };

  const config = getSliderConfig();

  return (
    <div className={`p-4 border rounded-lg bg-card ${className}`}>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold mb-2 block">
            Range Filter
          </label>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">
              Filter by distance from center
            </span>
            <span className="text-sm font-mono font-bold">
              {range.toFixed(unit === "km" ? 1 : 0)} {unit}
            </span>
          </div>
        </div>

        <div className="px-1">
          <input
            type="range"
            value={range}
            onChange={(e) => handleRangeChange(parseFloat(e.target.value))}
            min={config.min}
            max={config.max}
            step={config.step}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>
              {config.min}
              {unit}
            </span>
            <span>
              {config.max}
              {unit}
            </span>
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-2 block">
            Unit
          </label>
          <div className="flex gap-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="unit"
                value="meters"
                checked={unit === "meters"}
                onChange={() => handleUnitChange("meters")}
                className="w-4 h-4 text-primary"
              />
              <span className="text-sm">Meters</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="unit"
                value="km"
                checked={unit === "km"}
                onChange={() => handleUnitChange("km")}
                className="w-4 h-4 text-primary"
              />
              <span className="text-sm">Kilometers</span>
            </label>
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-2 block">
            Quick Presets
          </label>
          <div className="flex gap-2 flex-wrap">
            {unit === "km" ? (
              <>
                <button
                  onClick={() => handleRangeChange(1)}
                  className="px-3 py-1 text-xs border rounded hover:bg-accent transition-colors"
                >
                  1 km
                </button>
                <button
                  onClick={() => handleRangeChange(5)}
                  className="px-3 py-1 text-xs border rounded hover:bg-accent transition-colors"
                >
                  5 km
                </button>
                <button
                  onClick={() => handleRangeChange(10)}
                  className="px-3 py-1 text-xs border rounded hover:bg-accent transition-colors"
                >
                  10 km
                </button>
                <button
                  onClick={() => handleRangeChange(25)}
                  className="px-3 py-1 text-xs border rounded hover:bg-accent transition-colors"
                >
                  25 km
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleRangeChange(500)}
                  className="px-3 py-1 text-xs border rounded hover:bg-accent transition-colors"
                >
                  500 m
                </button>
                <button
                  onClick={() => handleRangeChange(1000)}
                  className="px-3 py-1 text-xs border rounded hover:bg-accent transition-colors"
                >
                  1 km
                </button>
                <button
                  onClick={() => handleRangeChange(2000)}
                  className="px-3 py-1 text-xs border rounded hover:bg-accent transition-colors"
                >
                  2 km
                </button>
                <button
                  onClick={() => handleRangeChange(5000)}
                  className="px-3 py-1 text-xs border rounded hover:bg-accent transition-colors"
                >
                  5 km
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RangeControl;
