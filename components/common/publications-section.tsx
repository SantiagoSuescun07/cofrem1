"use client";

import React from "react";
import { usePublications } from "@/queries/publications";
import { PublicationCardSkeleton } from "../skeletons/publications/publication-card-skeleton";
import { PublicationCard } from "../publications/publication-card";

export function PublicationsSection() {
  const { data: publications, isLoading } = usePublications();

  // Asegurar ordenamiento de más reciente a más antigua
  const sortedPublications = publications
    ? [...publications].sort((a, b) => {
        const dateA = new Date(a.created).getTime();
        const dateB = new Date(b.created).getTime();
        return dateB - dateA; // Orden descendente (más reciente primero)
      })
    : [];

  return (
    <div className="lg:col-span-2">
      
      <div className="space-y-6 ">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <PublicationCardSkeleton key={i} />
            ))
          : sortedPublications.map((publication) => (
              <PublicationCard key={publication.id} publication={publication} />
            ))}
      </div>
    </div>
  );
}
