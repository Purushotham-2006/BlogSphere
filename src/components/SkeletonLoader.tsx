import React from "react";

export function BlogCardSkeleton() {
  return (
    <div className="border border-neutral-200/60 dark:border-neutral-800/60 rounded-xl p-6 bg-white dark:bg-neutral-900 animate-pulse space-y-4">
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-1/4" />
          <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-1/6" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
        <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-full" />
        <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-5/6" />
      </div>
      <div className="w-full h-48 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
      <div className="flex items-center justify-between pt-2">
        <div className="flex space-x-2">
          <div className="h-5 bg-neutral-200 dark:bg-neutral-800 rounded w-14" />
          <div className="h-5 bg-neutral-200 dark:bg-neutral-800 rounded w-14" />
        </div>
        <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-20" />
      </div>
    </div>
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="w-full h-48 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
      <div className="flex flex-col md:flex-row items-start md:items-end -mt-16 px-6 space-y-4 md:space-y-0 md:space-x-6">
        <div className="w-28 h-28 bg-neutral-200 dark:bg-neutral-800 rounded-full border-4 border-neutral-50 dark:border-neutral-950" />
        <div className="flex-1 space-y-2">
          <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded w-1/3" />
          <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-1/4" />
        </div>
      </div>
      <div className="px-6 space-y-2">
        <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
        <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2" />
      </div>
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="border border-neutral-200/60 dark:border-neutral-800/60 rounded-xl p-5 bg-white dark:bg-neutral-900 animate-pulse space-y-4">
      <div className="h-5 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2" />
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-800 rounded-md" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
              <div className="h-2 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
