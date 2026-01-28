"use client";

import { AboutUsNode } from "@/services/about/get-menu";
import Image from "next/image";
import { useState, useEffect } from "react";
import { ZoomableImage } from "./zoomable-image";
import { GalleryModal } from "./gallery-modal";

interface AboutContentProps {
  section: AboutUsNode | null;
}

export function AboutContent({ section }: AboutContentProps) {
  const [loading, setLoading] = useState(true);
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);

  useEffect(() => {
    if (section) {
      setLoading(true);
      const timer = setTimeout(() => setLoading(false), 300);
      return () => clearTimeout(timer);
    } else {
      setLoading(false);
    }
  }, [section]);

  if (loading) {
    return (
      <div className="flex-1 bg-white rounded-r-2xl shadow-md p-8 animate-pulse space-y-8">
        <div className="h-8 w-1/3 bg-gray-200 rounded"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="h-40 bg-gray-200 rounded-xl"></div>
          <div className="h-40 bg-gray-200 rounded-xl"></div>
          <div className="h-40 bg-gray-200 rounded-xl"></div>
        </div>
        <div className="h-6 w-1/4 bg-gray-200 rounded mt-8"></div>
      </div>
    );
  }

  if (!section) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20 px-6" />
    );
  }

  // Contenido real
  const { title, body, field_gallery, field_file, field_main_image_optional } =
    section;
  const mainImage = field_main_image_optional?.[0];

  return (
    <div className="flex-1 bg-white rounded-r-2xl shadow-md p-8 overflow-y-auto space-y-8">
      <h1 className="text-2xl text-sky-700 mb-4">{title}</h1>

      <div className="prose max-w-none text-gray-700 leading-relaxed">
        {mainImage && (
          <div className="float-right ml-6 mb-4 max-w-[45%] md:max-w-[40%]">
            <ZoomableImage
              src={mainImage.url}
              alt={mainImage.alt || title}
              width={mainImage.width || 600}
              height={mainImage.height || 400}
              className="rounded-xl shadow-sm object-cover w-full h-auto"
            />
          </div>
        )}

        {/* Cuerpo del texto */}
        <div dangerouslySetInnerHTML={{ __html: body }} />
      </div>

      {/* Sección Galería */}
      {field_gallery && field_gallery.length > 0 && (
        <section className="mt-8 clear-both">
          <h3 className="text-xl text-sky-600 mb-3">Galería</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {field_gallery.map((img, index) => (
              <div
                key={img.target_id}
                className="cursor-pointer transition-transform hover:scale-[1.02] rounded-xl overflow-hidden shadow-sm"
                onClick={() => {
                  setGalleryInitialIndex(index);
                  setGalleryModalOpen(true);
                }}
              >
                <Image
                src={img.url}
                alt={img.alt}
                width={300}
                height={200}
                  className="rounded-xl object-cover w-full h-full"
              />
              </div>
            ))}
          </div>
          {galleryModalOpen && (
            <GalleryModal
              images={field_gallery.map((img) => ({
                id: String(img.target_id),
                url: img.url,
                alt: img.alt,
              }))}
              initialIndex={galleryInitialIndex}
              onClose={() => setGalleryModalOpen(false)}
            />
          )}
        </section>
      )}

      {/* Sección Archivos */}
      {field_file && field_file.length > 0 && (
        <section className="clear-both">
          <h3 className="text-xl text-sky-600 mb-3">Archivos</h3>
          <div className="flex flex-wrap gap-3">
            {field_file.map((file) => (
              <a
                key={file.target_id}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#e63946] font-medium hover:underline"
              >
                <Image
                  src="/icons/pdf-icon.png"
                  alt="PDF"
                  width={20}
                  height={20}
                />
                {file.description || "Documento PDF"}
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
