"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function SinglePublicationPageSkeleton() {
  return (
    <div className="min-h-screen bg-muted/30 md:pb-10 md:px-4">
      <article className="container mx-auto bg-white rounded-2xl shadow-md p-6 md:p-10">
        {/* Botón volver */}
        <div className="mb-6">
          <Skeleton className="h-8 w-40 rounded-md" />
        </div>

        {/* Título */}
        <Skeleton className="h-8 w-3/4 mb-4" />

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Imagen principal */}
        <div className="w-full h-72 mb-6 rounded-lg overflow-hidden">
          <Skeleton className="h-full w-full" />
        </div>

        {/* Descripción */}
        <div className="space-y-4 mb-10">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>

        {/* Galería */}
        <div className="mb-12">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>

        {/* Links */}
        <div className="space-y-4">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-5 w-36" />
        </div>
      </article>
    </div>
  );
}
