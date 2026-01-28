"use client";

import { Button } from "@/components/ui/button";
import { useSingleNewsletter } from "@/queries/newsletters";
import { ArrowLeft, Calendar, FileText, Paperclip } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { use } from "react";
import { NewsletterSkeleton } from "./_components/newsletter-skeleton";

export default function NewsletterPage({
  params,
}: {
  params: Promise<{ newsletterId: string }>;
}) {
  const { newsletterId: id } = use(params);
  const { data: newsletter, isLoading } = useSingleNewsletter(id);

  if (isLoading) {
    return <NewsletterSkeleton />;
  }

  if (!newsletter) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-red-500 font-medium">No se encontró el boletín.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40 md:pb-12 md:px-10 max-md:px-8 py-8">
      <article className="container mx-auto bg-white rounded-3xl shadow-lg overflow-hidden">
        {/* Encabezado con imagen */}
        {newsletter.field_main_image?.url && (
          <div className="relative w-full h-80 md:h-[420px]">
            {newsletter.field_link ? (
              <a 
                href={newsletter.field_link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block w-full h-full relative z-0"
              >
                <Image
                  src={newsletter.field_main_image.url}
                  alt={newsletter.field_main_image.alt || newsletter.title}
                  fill
                  priority
                  className="object-cover cursor-pointer"
                />
              </a>
            ) : (
              <Image
                src={newsletter.field_main_image.url}
                alt={newsletter.field_main_image.alt || newsletter.title}
                fill
                priority
                className="object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            <div className="absolute bottom-6 left-6 z-10 pointer-events-none">
              <h1 className="text-3xl md:text-4xl mb-2 drop-shadow-lg font-semibold" style={{ color: 'white' }}>
                {newsletter.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="flex items-center gap-1" style={{ color: 'white' }}>
                  <Calendar size={16} style={{ color: 'white' }} />
                  <span style={{ color: 'white' }}>
                    {new Date(newsletter.created).toLocaleDateString("es-CO", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </span>
                {newsletter.field_category_report && (
                  <span className="px-3 py-0.5 bg-white/20 rounded-full backdrop-blur-sm border border-white/30" style={{ color: 'white' }}>
                    {newsletter.field_category_report.name}
                  </span>
                )}
                {newsletter.field_type_report && (
                  <span className="px-3 py-0.5 bg-blue-600/80 rounded-full backdrop-blur-sm border border-white/30" style={{ color: 'white' }}>
                    {newsletter.field_type_report.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Contenido */}
        <div className="p-6 md:p-10">
          {/* Back button */}
          <div className="mb-8">
            <Link href="/newsletters">
              <Button
                variant="ghost"
                className="gap-2 hover:translate-x-[-4px] transition-transform"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver a boletines
              </Button>
            </Link>
          </div>

          {/* Descripción */}
          {newsletter.description && (
            <div
              className="prose prose-gray max-w-none mb-12 prose-headings:font-semibold prose-a:text-blue-600"
              dangerouslySetInnerHTML={{ __html: newsletter.description }}
            />
          )}

          {/* PDF destacado */}
          {newsletter.field_report_pdf && (
            <div className="mb-12">
              <h3 className="text-xl mb-5 flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-600" />
                Documento principal del boletín
              </h3>

              <div className="flex flex-col md:flex-row items-center justify-between border rounded-2xl p-6 bg-gradient-to-r from-red-50 to-red-100 shadow-sm hover:shadow-md transition">
                {/* Icono PDF grande */}
                <div className="flex items-center gap-4 w-full md:w-auto mb-4 md:mb-0">
                  <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-red-600 text-white text-lg shadow">
                    PDF
                  </div>
                  <div>
                    <p className="text-base text-gray-800">
                      Boletín en formato PDF
                    </p>
                    <p className="text-sm text-gray-600">
                      Abrelo en una nueva pestaña
                    </p>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex gap-3 w-full md:w-auto">
                  <Link
                    href={newsletter.field_report_pdf.url}
                    target="_blank"
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition"
                  >
                    <FileText size={18} />
                    Ver PDF
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Adjuntos */}
          {newsletter.field_attachments.length > 0 && (
            <div className="mb-10">
              <h3 className="text-xl mb-5 flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-blue-600" />
                Archivos adjuntos
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {newsletter.field_attachments.map((att) => {
                  const fileName = att.url.split("/").pop();
                  const extension = fileName?.split(".").pop()?.toUpperCase();

                  return (
                    <Link
                      href={att.url}
                      target="_blank"
                      key={att.id}
                      className="cursor-pointer flex items-center justify-between border rounded-xl p-4 bg-gray-50 hover:bg-gray-100 transition"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {/* Icono del archivo */}
                        <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-100 text-blue-600 font-semibold">
                          {extension || "DOC"}
                        </div>

                        {/* Nombre del archivo */}
                        <span className="truncate text-sm font-medium text-gray-700 max-w-[180px] md:max-w-[250px]">
                          {fileName}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
