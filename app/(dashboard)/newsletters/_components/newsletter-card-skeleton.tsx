"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function NewsletterCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden shadow-md bg-white">
      {/* Imagen */}
      <div className="relative w-full h-48">
        <Skeleton className="w-full h-full" />
      </div>

      {/* Contenido */}
      <div className="p-5 flex flex-col gap-3">
        {/* Categoría y tipo */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>

        {/* Título */}
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />

        {/* Descripción */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[90%]" />
          <Skeleton className="h-4 w-[80%]" />
        </div>

        {/* Fecha */}
        <Skeleton className="h-4 w-28 mt-auto" />
      </div>
    </div>
  );
}
