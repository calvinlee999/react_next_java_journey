import React from 'react';

interface ProgressProps {
  value: number;
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({ value, className = '' }) => {
  const clampedValue = Math.min(100, Math.max(0, value));
  
  // Create width classes based on value ranges
  const getWidthClass = (val: number) => {
    if (val >= 95) return 'w-full';
    if (val >= 90) return 'w-11/12';
    if (val >= 80) return 'w-4/5';
    if (val >= 75) return 'w-3/4';
    if (val >= 70) return 'w-2/3';
    if (val >= 60) return 'w-3/5';
    if (val >= 50) return 'w-1/2';
    if (val >= 40) return 'w-2/5';
    if (val >= 33) return 'w-1/3';
    if (val >= 25) return 'w-1/4';
    if (val >= 20) return 'w-1/5';
    if (val >= 10) return 'w-1/12';
    return 'w-0';
  };
  
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <div className={`bg-blue-500 h-2 rounded-full transition-all duration-300 ${getWidthClass(clampedValue)}`} />
    </div>
  );
};