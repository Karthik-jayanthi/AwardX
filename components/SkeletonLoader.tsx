import React from 'react';

type SkeletonLoaderProps = {
  className?: string;
};

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ className = '' }) => {
  return <div className={`animate-pulse rounded-xl bg-slate-200/70 ${className}`} />;
};

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ rows = 6, columns = 6 }) => {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((__, colIdx) => (
            <SkeletonLoader key={`${rowIdx}-${colIdx}`} className="h-10" />
          ))}
        </div>
      ))}
    </div>
  );
};
