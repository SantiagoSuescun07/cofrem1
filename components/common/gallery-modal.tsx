"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GalleryModalProps {
  images: {
    id?: string;
    url: string;
    alt?: string;
    title?: string;
  }[];
  initialIndex?: number;
  onClose: () => void;
}

/**
 * 🖼️ GalleryModal mejorado
 * - Botón de retroceso visible
 * - Transición suave sin parpadeo
 * - Skeleton de carga
 */
export function GalleryModal({
  images,
  initialIndex = 0,
  onClose,
}: GalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const nextImage = () =>
    setCurrentIndex((prev) => (prev + 1) % images.length);
  const prevImage = () =>
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  // Control con teclado
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => setIsMounted(true), []);

  if (!images || images.length === 0 || !isMounted) return null;

  const currentImage = images[currentIndex];

  const modalContent = (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(event) => event.stopPropagation()}
    >
      {/* Botón cerrar */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white hover:text-gray-300 transition z-[10000]"
      >
        <X className="w-8 h-8" />
      </button>

      {/* Imagen principal con animación suave */}
      <div className="relative flex items-center justify-center w-full max-w-5xl px-4 select-none">
        {/* Botón anterior */}
        {images.length > 1 && (
          <button
            onClick={prevImage}
            className="absolute left-2 md:left-6 z-50 p-2 rounded-full bg-white/20 hover:bg-white/40 transition"
          >
            <ChevronLeft className="w-8 h-8 text-white" />
          </button>
        )}

        {/* Contenedor con Skeleton y Fade suave */}
        <div className="relative flex justify-center w-full min-h-[60vh] max-h-[80vh]">
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 bg-gray-700/50 rounded-full animate-pulse" />
            </div>
          )}

          <motion.img
            key={currentImage.url}
            src={currentImage.url}
            alt={currentImage.alt || ""}
            onLoad={() => setIsLoaded(true)}
            className={`max-h-[80vh] w-auto rounded-lg object-contain transition-opacity duration-500 ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>

        {/* Botón siguiente */}
        {images.length > 1 && (
          <button
            onClick={nextImage}
            className="absolute right-2 md:right-6 z-50 p-2 rounded-full bg-white/20 hover:bg-white/40 transition"
          >
            <ChevronRight className="w-8 h-8 text-white" />
          </button>
        )}
      </div>

      {/* Miniaturas */}
      {images.length > 1 && (
        <div className="mt-6 flex gap-2 overflow-x-auto max-w-full px-4 pb-4">
          {images.map((img, idx) => (
            <button
              key={img.id || idx}
              onClick={() => {
                setCurrentIndex(idx);
                setIsLoaded(false);
              }}
              className={`relative w-20 h-16 flex-shrink-0 rounded-md overflow-hidden border-2 transition ${
                idx === currentIndex
                  ? "border-blue-500"
                  : "border-transparent hover:border-white/40"
              }`}
            >
              <Image
                src={img.url}
                alt={img.alt || ""}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );

  return createPortal(modalContent, document.body);
}
