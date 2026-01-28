"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function PublicationCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-md p-5">
      {/* Título */}
      <Skeleton className="h-5 w-48 mb-3" />

      {/* Grid imágenes */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Skeleton className="col-span-2 row-span-2 h-48 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-16 rounded-full" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-12" />
        </div>
      </div>
    </div>
  );
}
