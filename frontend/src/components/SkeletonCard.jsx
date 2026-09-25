import React from 'react';

export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 animate-pulse">
      <div className="flex items-start gap-3.5 mb-5">
        <div className="w-[72px] h-[72px] rounded-md bg-zinc-200 flex-shrink-0" />
        <div className="flex-1 pt-1">
          <div className="h-5 w-2/3 bg-zinc-200 rounded-md" />
          <div className="h-3 w-1/2 bg-zinc-100 rounded mt-2" />
          <div className="h-3 w-3/4 bg-zinc-100 rounded mt-4" />
        </div>
      </div>

      <div className="border-t border-zinc-100 pt-4 mb-4">
        <div className="h-2.5 w-20 bg-zinc-100 rounded mb-2.5" />
        <div className="h-3 w-full bg-zinc-100 rounded" />
        <div className="h-3 w-5/6 bg-zinc-100 rounded mt-2" />
      </div>
      <div className="grid grid-cols-3 border-y border-zinc-100 py-3.5 mb-4">
        {[0, 1, 2].map((item) => (
          <div key={item} className={item ? 'border-l border-zinc-100 pl-4' : ''}>
            <div className="h-2.5 w-10 bg-zinc-100 rounded" />
            <div className="h-5 w-8 bg-zinc-200 rounded mt-2" />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="h-3 w-24 bg-zinc-100 rounded" />
        <div className="h-3 w-16 bg-zinc-100 rounded" />
      </div>
    </div>
  );
}
