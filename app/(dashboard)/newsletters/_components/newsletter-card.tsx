"use client";

import React from "react";
import Image from "next/image";
import { Calendar } from "lucide-react";
import { Newsletter } from "@/types/newsletters";

interface Props {
  report: Newsletter;
};

export function NewsletterCard({ report }: Props) {
  const { title, description, created, field_main_image, field_category_report, field_type_report, field_link } =
    report;

  // Si no hay link, renderizar como div no clickeable
  if (!field_link) {
    return (
      <div className="group block rounded-2xl overflow-hidden shadow-md bg-white opacity-75">
        {/* Imagen */}
        {field_main_image?.url && (
          <div className="relative w-full h-48">
            <Image
              src={field_main_image.url}
              alt={field_main_image.alt || title}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Contenido */}
        <div className="p-5 flex flex-col gap-3">
          {/* Categoría y tipo */}
          <div className="flex items-center gap-2 text-xs text-gray-600">
            {field_category_report && (
              <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                {field_category_report.name}
              </span>
            )}
            {field_type_report && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                {field_type_report.name}
              </span>
            )}
          </div>

          {/* Título */}
          <h3 className="text-lg line-clamp-2">
            {title}
          </h3>

          {/* Descripción */}
          {description && (
            <p className="text-sm text-gray-700 line-clamp-3">{description}</p>
          )}

          {/* Fecha */}
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-auto">
            <Calendar size={14} />
            {new Date(created).toLocaleDateString("es-CO", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <a
      href={field_link}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow bg-white"
    >
      {/* Imagen */}
      {field_main_image?.url && (
        <div className="relative w-full h-48">
          <Image
            src={field_main_image.url}
            alt={field_main_image.alt || title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}

      {/* Contenido */}
      <div className="p-5 flex flex-col gap-3">
        {/* Categoría y tipo */}
        <div className="flex items-center gap-2 text-xs text-gray-600">
          {field_category_report && (
            <span className="px-2 py-0.5 bg-gray-100 rounded-full">
              {field_category_report.name}
            </span>
          )}
          {field_type_report && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
              {field_type_report.name}
            </span>
          )}
        </div>

        {/* Título */}
        <h3 className="text-lg group-hover:text-blue-600 line-clamp-2">
          {title}
        </h3>

        {/* Descripción */}
        {description && (
          <p className="text-sm text-gray-700 line-clamp-3">{description}</p>
        )}

        {/* Fecha */}
        <div className="flex items-center gap-1 text-xs text-gray-500 mt-auto">
          <Calendar size={14} />
          {new Date(created).toLocaleDateString("es-CO", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>
    </a>
  );
}
