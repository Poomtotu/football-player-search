import React from 'react';

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-5 animate-pulse flex flex-col justify-between border border-gray-200 shadow-sm">
      <div>
        {/* Top Header */}
        <div className="flex items-start space-x-3.5 mb-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gray-200 flex-shrink-0"></div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-5 bg-gray-200 rounded-md w-3/4"></div>
            <div className="h-3.5 bg-gray-100 rounded-md w-1/2"></div>
            <div className="flex space-x-1.5 pt-1">
              <div className="h-4 bg-gray-100 rounded w-20"></div>
              <div className="h-4 bg-gray-100 rounded w-16"></div>
            </div>
          </div>
        </div>

        {/* Aliases Pill Skeleton */}
        <div className="flex space-x-1.5 mb-4">
          <div className="h-4 bg-gray-100 rounded-md w-12"></div>
          <div className="h-4 bg-gray-100 rounded-md w-16"></div>
          <div className="h-4 bg-gray-100 rounded-md w-14"></div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="h-16 bg-gray-100 rounded-xl"></div>
          <div className="h-16 bg-gray-100 rounded-xl"></div>
          <div className="h-16 bg-gray-100 rounded-xl"></div>
        </div>

        {/* National Team Skeleton */}
        <div className="h-10 bg-gray-100 rounded-xl mb-3"></div>

        {/* History Badges Skeleton */}
        <div className="flex space-x-1">
          <div className="h-5 bg-gray-100 rounded w-16"></div>
          <div className="h-5 bg-gray-100 rounded w-20"></div>
          <div className="h-5 bg-gray-100 rounded w-14"></div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-3 mt-4 border-t border-gray-100 flex justify-between">
        <div className="h-3.5 bg-gray-100 rounded w-28"></div>
        <div className="h-3.5 bg-gray-100 rounded w-4"></div>
      </div>
    </div>
  );
}
