"use client";

import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ZoomableImageProps {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
}

export function ZoomableImage({
  src,
  alt = "",
  width = 400,
  height = 300,
  className = "",
}: ZoomableImageProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Imagen pequeña */}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`cursor-pointer transition-transform hover:scale-[1.02] ${className}`}
        onClick={() => setIsOpen(true)}
      />

      {/* Modal fullscreen */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            {/* Botón cerrar */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 text-white hover:text-gray-300 transition"
            >
              <X className="w-7 h-7" />
            </button>

            {/* Imagen ampliada */}
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 120, damping: 12 }}
              className="flex items-center justify-center relative w-fit h-auto"
            >
              <Image
                src={src}
                alt={alt}
                width={width * 2}
                height={height * 2}
                className="rounded-xl object-contain w-[600px] max-h-[600px]"
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
