"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function NewsletterSkeleton() {
  return (
    <div className="min-h-screen bg-muted/40 md:pb-12 md:px-4">
      <article className="container mx-auto bg-white rounded-3xl shadow-lg overflow-hidden">
        {/* Hero con imagen */}
        <div className="relative w-full h-80 md:h-[420px]">
          <Skeleton className="w-full h-full" />
          <div className="absolute bottom-6 left-6 space-y-3">
            <Skeleton className="h-8 w-72 rounded-md" />
            <div className="flex gap-3">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 md:p-10">
          {/* Back button */}
          <div className="mb-8">
            <Skeleton className="h-9 w-36 rounded-lg" />
          </div>

          {/* Descripción */}
          <div className="space-y-3 mb-12">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-[90%]" />
            <Skeleton className="h-5 w-[85%]" />
            <Skeleton className="h-5 w-[70%]" />
          </div>

          {/* PDF destacado */}
          <div className="mb-12 space-y-4">
            <Skeleton className="h-6 w-64" />
            <div className="flex flex-col md:flex-row items-center justify-between border rounded-2xl p-6 bg-gray-50">
              <div className="flex items-center gap-4 w-full md:w-auto mb-4 md:mb-0">
                <Skeleton className="w-14 h-14 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-36" />
                </div>
              </div>
              <Skeleton className="h-10 w-32 rounded-lg" />
            </div>
          </div>

          {/* Adjuntos */}
          <div className="mb-10 space-y-4">
            <Skeleton className="h-6 w-56" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border rounded-xl p-4 bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <Skeleton className="h-8 w-20 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
