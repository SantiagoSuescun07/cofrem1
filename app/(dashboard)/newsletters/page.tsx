"use client";

import React from "react";
import { NewslettersBreadcrumb } from "./_components/newsletters-breadcrumb";
import { useNewsletters } from "@/queries/newsletters";
import { NewsletterCard } from "./_components/newsletter-card";
import { NewsletterCardSkeleton } from "./_components/newsletter-card-skeleton";

export default function NewslettersPage() {
  const { data: newsletters, isLoading } = useNewsletters();

  const hasNoData = !isLoading && (!newsletters || newsletters.length === 0);

  return (
    <div className="relative">
      <div className="container mx-auto px-6 md:px-10 pt-6">
        <NewslettersBreadcrumb />

        <h2 className="text-3xl mb-8">Portal de Boletines</h2>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <NewsletterCardSkeleton key={i} />
            ))}
          </div>
        ) : hasNoData ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500">
            <p className="text-lg font-medium">No hay boletines disponibles</p>
            <p className="text-sm mt-2">
              Cuando se publiquen nuevos boletines, aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {newsletters?.map((report) => (
              <NewsletterCard key={report.id} report={report} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
