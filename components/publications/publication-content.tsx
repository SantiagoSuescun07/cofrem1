"use client";

import { PublicationContent } from "@/types/publications";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { GalleryModal } from "../common/gallery-modal";
import { useRouter } from "next/navigation";

interface Props {
  content: PublicationContent;
}

const getDriveEmbedUrl = (uri: string) => {
  const match = uri.match(/\/d\/([^/]+)/);
  if (match?.[1]) {
    return `https://drive.google.com/file/d/${match[1]}/preview`;
  }
  return uri;
};

export function PublicationContentRenderer({ content }: Props) {
  const router = useRouter();
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  const openGallery = (index: number) => {
    setStartIndex(index);
    setIsGalleryOpen(true);
  };

  switch (content.type) {
    case "paragraph--link": {
      if (!content.field_link) return null;
      return (
        <div className="mb-6">
          <a
            href={content.field_link.uri}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-[150px] ml-auto -mt-10  px-6 py-3 bg-[#35a3f2] text-white rounded-lg hover:bg-[#7dc2f4] transition-colors font-medium"
          >
            Ver más
          </a>
        </div>
      );
    }

    // case "paragraph--galeria_publicaciones": {
    //   if (!content.field_gallery_images || content.field_gallery_images.length === 0)
    //     return null;

    //   const images = content.field_gallery_images;
    //   const visibleImages = images.slice(0, 4);
    //   const extraCount = images.length > 4 ? images.length - 4 : 0;

    //   return (
    //     <div className="mb-6">
    //       <h3 className="text-lg font-semibold text-gray-900 mb-4">Galería</h3>
    //       <div
    //         className={`grid gap-2 ${
    //           visibleImages.length === 1
    //             ? "grid-cols-1"
    //             : visibleImages.length === 2
    //             ? "grid-cols-2"
    //             : "grid-cols-2 grid-rows-2"
    //         }`}
    //       >
    //         {visibleImages.map((img, index) => {
    //           const isMain = index === 0 && visibleImages.length > 1;
    //           const hasMore = index === 3 && extraCount > 0;

    //           return (
    //             <div
    //               key={img.id || index}
    //               onClick={() => openGallery(index)}
    //               className={`relative overflow-hidden rounded-lg cursor-pointer ${
    //                 isMain ? "row-span-2" : "h-40"
    //               }`}
    //             >
    //               <Image
    //                 src={img.url}
    //                 alt={img.alt || "Imagen de galería"}
    //                 fill
    //                 className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
    //               />
    //               {hasMore && (
    //                 <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-2xl font-semibold">
    //                   +{extraCount}
    //                 </div>
    //               )}
    //             </div>
    //           );
    //         })}
    //       </div>
    //       {isGalleryOpen && (
    //         <GalleryModal
    //           images={images.map((img) => ({
    //             id: img.id,
    //             url: img.url,
    //             alt: img.alt,
    //             title: img.title,
    //             width: img.width,
    //             height: img.height,
    //           }))}
    //           initialIndex={startIndex}
    //           onClose={() => setIsGalleryOpen(false)}
    //         />
    //       )}
    //     </div>
    //   );
    // }

    case "paragraph--enriched_text": {
      if (!content.field_body) return null;
      
      // Función para limpiar el HTML de estilos inline de Facebook
      const cleanHtml = (html: string): string => {
        if (typeof window === 'undefined') return html;
        
        // Crear un elemento temporal para parsear el HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Reemplazar imágenes de emojis de Facebook con emojis reales primero
        const emojiImages = tempDiv.querySelectorAll('img[src*="emoji.php"]');
        emojiImages.forEach((img) => {
          const alt = img.getAttribute('alt');
          if (alt) {
            const emojiSpan = document.createElement('span');
            emojiSpan.textContent = alt;
            emojiSpan.className = 'inline-block mr-1';
            img.parentNode?.replaceChild(emojiSpan, img);
          } else {
            img.remove();
          }
        });
        
        // Remover todos los estilos inline y clases de Facebook
        const allElements = tempDiv.querySelectorAll('*');
        allElements.forEach((el) => {
          // Remover estilos inline
          el.removeAttribute('style');
          // Remover clases de Facebook (que empiezan con 'x' y tienen más de 5 caracteres)
          const classes = Array.from(el.classList);
          classes.forEach((cls) => {
            if (cls.startsWith('x') && cls.length > 5) {
              el.classList.remove(cls);
            }
          });
          // Remover atributos innecesarios
          el.removeAttribute('dir');
          el.removeAttribute('referrerpolicy');
          el.removeAttribute('loading');
        });
        
        // Limpiar divs vacíos o con solo espacios
        const emptyDivs = tempDiv.querySelectorAll('div');
        emptyDivs.forEach((div) => {
          if (div.textContent?.trim() === '' && div.children.length === 0) {
            div.remove();
          }
        });
        
        return tempDiv.innerHTML;
      };
      
      // Limpiar el HTML
      const cleanedHtml = cleanHtml(content.field_body);
      
      return (
        <div className="mb-6">
          <div
            className="prose prose-sm md:prose-base max-w-none text-gray-800 leading-relaxed [&_div]:my-2 [&_div]:text-base [&_span]:inline-block [&_span]:mr-1 [&_*]:text-gray-800"
            style={{
              // Sobrescribir estilos inline que puedan quedar
              fontFamily: 'inherit',
            }}
            dangerouslySetInnerHTML={{ __html: cleanedHtml }}
          />
        </div>
      );
    }

    case "paragraph--game_type_publication": {
      if (!content.field_game) return null;
      
      // Función para mapear el tipo de juego a la ruta
      const getGameRoute = (gameType: string): string | null => {
        switch (gameType) {
          case "paragraph--wordsearch_game":
            return `/games/wordsearch?id=${content.field_game!.id}`;
          case "paragraph--puzzle_game":
            return `/games/puzzle?id=${content.field_game!.id}`;
          case "paragraph--complete_phrase_game":
            return `/games/complete-phrase?id=${content.field_game!.id}`;
          case "paragraph--trivia_game":
            return `/games/trivia?id=${content.field_game!.id}`;
          case "paragraph--emoji_discovery_game":
            return `/games/emoji-discovery?id=${content.field_game!.id}`;
          case "paragraph--hangman_game":
            return `/games/hangman?id=${content.field_game!.id}`;
          case "paragraph--memory_game":
            return `/games/memory?id=${content.field_game!.id}`;
          case "paragraph--quiz_game":
            return `/games/quiz?id=${content.field_game!.id}`;
          case "paragraph--true_false_game":
            return `/games/true-false?id=${content.field_game!.id}`;
          case "paragraph--word_match_game":
            return `/games/word-match?id=${content.field_game!.id}`;
          // Para otros tipos de juegos que aún no tienen página específica, redirigir a /games
          default:
            return `/games`;
        }
      };

      const gameRoute = getGameRoute(content.field_game.gameType);

      return (
        <div className="mb-6">
          <div className="p-6 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
            <h3 className="text-lg text-gray-900 mb-2">
              🎮 Juego Disponible
            </h3>
            {content.field_game.title && (
              <h4 className="text-md font-medium text-gray-800 mb-2">
                {content.field_game.title}
              </h4>
            )}
            {content.field_game.description && (
              <p className="text-sm text-gray-600 mb-4">
                {content.field_game.description}
              </p>
            )}
            <button
              onClick={() => {
                if (gameRoute) {
                  router.push(gameRoute);
                } else {
                  router.push("/games");
                }
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Jugar Ahora
            </button>
          </div>
        </div>
      );
    }

    case "paragraph--video_from_drive": {
      const videoData = content.field_video_from_drive;
      if (!videoData?.uri) return null;

      const embedUrl = getDriveEmbedUrl(videoData.uri);

      return (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Video relacionado
          </h3>
          <div className="relative w-full overflow-hidden rounded-xl shadow-lg bg-black aspect-video">
            <iframe
              src={embedUrl}
              title={videoData.title || "Video"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
          {videoData.title && (
            <p className="mt-2 text-sm text-gray-600">{videoData.title}</p>
          )}
        </div>
      );
    }

    default:
      return null;
  }
}

