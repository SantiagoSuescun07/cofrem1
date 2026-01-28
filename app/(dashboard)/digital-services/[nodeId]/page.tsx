"use client";

import { useDigitalServiceNodeQuery } from "@/queries/digital-services";
import { use } from "react";
import { useRouter } from "next/navigation";
import { ProgressBar } from "@/components/common/progress-bar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ArticleCarousel } from "@/app/(dashboard)/noticias/[newsId]/_components/article-carousel";

export default function DigitalServiceNodePage({
  params,
}: {
  params: Promise<{ nodeId: string }>;
}) {
  const router = useRouter();
  const { nodeId } = use(params);
  const { data: node, isLoading, isError, error } = useDigitalServiceNodeQuery(nodeId);

  console.log(`DigitalServiceNodePage - nodeId: ${nodeId}, isLoading: ${isLoading}, isError: ${isError}, node:`, node);

  if (isLoading) {
    return (
      <div className="md:pb-10 px-6 md:px-10 pt-6 space-y-6">
        <Skeleton className="h-6 w-64" />
        <div className="min-h-screen bg-muted/30">
          <article className="container mx-auto bg-white rounded-2xl shadow-md p-6 md:p-10">
            <Skeleton className="h-10 w-3/4 mb-4" />
            <Skeleton className="h-64 w-full" />
          </article>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="md:pb-10 px-6 md:px-10 pt-6">
        <div className="container mx-auto bg-white rounded-2xl shadow-md p-6 md:p-10">
          <p className="text-red-500">Error al cargar el servicio: {error?.message}</p>
        </div>
      </div>
    );
  }

  if (!node) {
    router.push("/");
    return null;
  }

  const formattedDate = node.created
    ? new Date(node.created).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <div className="md:pb-10 px-6 md:px-10 pt-6 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Inicio</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="flex items-center gap-3">
              Servicios en línea <ProgressBar />
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="min-h-screen bg-muted/30">
        <article className="container mx-auto bg-white rounded-2xl shadow-md p-6 md:p-10">
          {/* Icono y título */}
          <div className="flex items-center gap-4 mb-6">
            {node.field_icon?.url && (
              <div className="flex-shrink-0">
                <Image
                  src={node.field_icon.url}
                  alt={node.field_icon.alt || node.title}
                  width={64}
                  height={64}
                  className="object-contain"
                />
              </div>
            )}
            <h1 className="text-2xl md:text-4xl text-[#323c45]">{node.title}</h1>
          </div>

          {/* Metadata */}
          {formattedDate && (
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-8">
              <span>Fecha de creación: {formattedDate}</span>
            </div>
          )}

          {/* Imagen principal si existe */}
          {node.field_main_image_optional && (
            <div className="mb-8 flex justify-center">
              <div className="max-w-2xl w-full">
                <Image
                  src={node.field_main_image_optional.url}
                  alt={node.field_main_image_optional.alt || node.title}
                  width={node.field_main_image_optional.width || 800}
                  height={node.field_main_image_optional.height || 450}
                  className="w-full h-auto rounded-3xl shadow-md object-contain"
                  priority
                />
              </div>
            </div>
          )}

          {/* Body con contenido HTML */}
          {node.body && (
            <div className="prose prose-lg max-w-none mb-10 leading-relaxed">
              <div dangerouslySetInnerHTML={{ __html: node.body }} />
            </div>
          )}

          {/* Galería de imágenes - Filtrar la imagen principal si está duplicada */}
          {node.field_gallery && node.field_gallery.length > 0 && (() => {
            // Filtrar la galería para excluir la imagen principal si es la misma
            const mainImageId = node.field_main_image_optional?.target_id;
            const filteredGallery = mainImageId
              ? node.field_gallery.filter((img) => img.target_id !== mainImageId)
              : node.field_gallery;

            // Solo mostrar la galería si hay imágenes después de filtrar
            if (filteredGallery.length === 0) return null;

            return (
              <div className="mb-12 md:mt-20">
                <h3 className="flex items-center text-2xl mb-4">
                  <Image
                    src="/icons/blue-image.png"
                    alt="Image icon"
                    width={40}
                    height={40}
                    priority
                    className="size-[23px] mr-2"
                  />{" "}
                  <span className="mr-3">Galería</span>
                  <ProgressBar />
                </h3>
                <ArticleCarousel
                  images={filteredGallery.map((img) => ({
                    id: String(img.target_id),
                    url: img.url,
                    alt: img.alt || node.title,
                  }))}
                />
              </div>
            );
          })()}

          {/* Archivo adjunto */}
          {node.field_file && node.field_file.display && (
            <div className="mb-8 rounded-2xl transition">
              <div className="px-6 py-4">
                <h3 className="flex items-center text-2xl mb-4">
                  <Image
                    src="/icons/blue-folder.png"
                    alt="Folder icon"
                    width={40}
                    height={40}
                    priority
                    className="size-[23px] mr-2"
                  />{" "}
                  <span className="mr-3">Archivo</span>
                  <ProgressBar />
                </h3>

                {/* Info del archivo */}
                <div>
                  {node.field_file.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {node.field_file.description}
                    </p>
                  )}

                  {/* Botón de descarga */}
                  <div className="flex items-center gap-3 pl-4">
                    <Link
                      target="_blank"
                      href={node.field_file.url}
                      download
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                      <Image
                        src="/icons/pdf-icon.png"
                        alt="PDF icon"
                        width={40}
                        height={40}
                        priority
                        className="w-[30px] h-[40px] object-cover"
                      />
                      <span className="text-blue-600 hover:underline font-medium">
                        {node.field_file.filename || "Descargar archivo"}
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}

