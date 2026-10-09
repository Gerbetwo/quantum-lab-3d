import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = 'h-4 w-full' }) => {
  return (
    <div
      className={`bg-[#172238] animate-pulse rounded-md ${className}`}
      role="status"
      aria-label="Cargando..."
    />
  );
};
