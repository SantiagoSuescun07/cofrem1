"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PublicationComments } from "@/app/(dashboard)/publications/[publicationId]/_components/publication-comments";
import { Publication } from "@/types/publications";
import Link from "next/link";
import { GalleryModal } from "../common/gallery-modal";
import Image from "next/image";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createReaction } from "@/services/news/reactions";
import { toast } from "sonner";
import { getPublicationsReactions } from "@/queries/publications";
import { useComments } from "@/queries/news";
import { ProgressBar } from "../common/progress-bar";
import { useRouter } from "next/navigation";

interface Props {
  publication: Publication;
}

const getDriveEmbedUrl = (uri: string) => {
  const match = uri.match(/\/d\/([^/]+)/);
  if (match?.[1]) {
    return `https://drive.google.com/file/d/${match[1]}/preview`;
  }
  return uri;
};

export function PublicationCard({ publication }: Props) {
  const {
    title,

    field_gallery = [],
    field_image,
    field_options_in_publication,
  } = publication;
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: allComments } = useComments(publication.id);

  const totalComments = allComments?.length || 0;

  // Obtener reacciones de la publicación
  const { data } = getPublicationsReactions(
    publication.drupal_internal__nid.toString()
  );

  // Mutación para registrar una reacción
  const mutation = useMutation({
    mutationFn: (reactionType: string) =>
      createReaction(
        publication.drupal_internal__nid.toString(),
        "field_reaction",
        reactionType
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["reactions", publication.drupal_internal__nid.toString()],
      });
    },
    onError: () => toast.error("No se pudo registrar tu reacción"),
  });

  // Verificar si hay un video
  const hasVideo =
    field_options_in_publication?.type === "paragraph--video_from_drive";

  const images = [
    ...(field_image ? [field_image] : []),
    ...(field_gallery || []),
  ];

  const visibleImages = images.slice(0, 3);
  const extraCount = images.length > 3 ? images.length - 3 : 0;

  const [isOpen, setIsOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  const fieldReaction = data?.fields.find(
    (f) => f.field_name === "field_reaction"
  );

  const openGallery = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setStartIndex(index);
    setIsOpen(true);
  };

  // Obtener el link de la publicación (puede estar en field_options_in_publication o field_any_link)
  const getPublicationLink = (): string | null => {
    // Primero verificar si hay un link en field_options_in_publication
    if (
      field_options_in_publication?.type === "paragraph--link" &&
      field_options_in_publication?.field_link?.uri
    ) {
      return field_options_in_publication.field_link.uri;
    }
    // Si no, verificar field_any_link
    if (publication.field_any_link) {
      return publication.field_any_link;
    }
    return null;
  };

  const handleImageClick = (e: React.MouseEvent, index: number) => {
    const link = getPublicationLink();
    // Si hay un link, abrir el link en nueva pestaña
    if (link) {
      e.preventDefault();
      e.stopPropagation();
      window.open(link, "_blank");
    } else {
      // Si no hay link, abrir la galería
      openGallery(e, index);
    }
  };

  return (
    <div className="block bg-white rounded-2xl shadow-md p-5 hover:shadow-lg transition mt-14 cursor-pointer">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Image
            src="/icons/blue-news.png"
            alt="Publications icon"
            width={20}
            height={20}
            priority
            className="size-5 object-cover"
          />
          <h3 className="text-2xl">Publicaciones</h3>
        </div>
        <ProgressBar />
      </div>
      <h3
        className="text-lg font-normal text-gray-900 hover:text-primary cursor-pointer"
        onClick={() => router.push(`/publications/${publication.id}`)}
      >
        {title}
      </h3>

      {publication.field_description && (
        <div
          onClick={() => router.push(`/publications/${publication.id}`)}
          className="prose prose-sm md:prose-base max-w-none text-gray-700 mb-6 leading-relaxed cursor-pointer"
          dangerouslySetInnerHTML={{
            __html: publication.field_description,
          }}
        />
      )}

      {/* Video si existe */}
      {hasVideo &&
        field_options_in_publication?.field_video_from_drive?.uri && (
          <div className="mt-4 relative w-full overflow-hidden rounded-lg shadow-md bg-black aspect-video">
            <iframe
              src={getDriveEmbedUrl(
                field_options_in_publication.field_video_from_drive.uri
              )}
              title={
                field_options_in_publication.field_video_from_drive.title ||
                "Video"
              }
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        )}

      {/* Grid de imágenes - solo mostrar si no hay video o si hay imágenes adicionales */}
      {!hasVideo && visibleImages.length > 0 && (
        <div
          className={`mt-4 grid gap-2 ${
            visibleImages.length === 1
              ? "grid-cols-1"
              : "grid-cols-2 grid-rows-2"
          }`}
        >
          {/* Imagen principal */}
          {visibleImages[0] && (
            <div
              className={`relative overflow-hidden rounded-lg cursor-pointer ${
                visibleImages.length > 1 ? "row-span-2" : "h-120"
              }`}
              onClick={(e) => handleImageClick(e, 0)}
            >
              <Image
                src={visibleImages[0].url}
                alt={visibleImages[0].alt || title}
                fill
                className="object-cover w-full h-full"
              />
            </div>
          )}

          {/* Imágenes secundarias */}
          {visibleImages.slice(1).map((img, index) => {
            const globalIndex = index + 1;
            return (
              <div
                key={img.id || globalIndex}
                className="relative h-40 overflow-hidden rounded-lg cursor-pointer"
                onClick={(e) => handleImageClick(e, globalIndex)}
              >
                {index === 1 && extraCount > 0 ? (
                  <div>
                    <Image
                      src={img.url}
                      alt={img.alt || title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-2xl font-semibold rounded-lg">
                      +{extraCount}
                    </div>
                  </div>
                ) : (
                  <Image
                    src={img.url}
                    alt={img.alt || title}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Mostrar imágenes si hay video pero también hay imágenes */}
      {hasVideo && visibleImages.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-gray-500 mb-2">Imágenes relacionadas</p>
          <div className="grid grid-cols-3 gap-2">
            {visibleImages.slice(0, 3).map((img, index) => (
              <div
                key={img.id || index}
                className="relative h-24 overflow-hidden rounded-lg cursor-pointer"
                onClick={(e) => handleImageClick(e, index)}
              >
                <Image
                  src={img.url}
                  alt={img.alt || title}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-col  justify-between mt-4">
        <span className="px-3 py-1 bg-gray-100 text-xs w-fit rounded-full">
          Social
        </span>
        <div className="flex items-center gap-4 text-gray-500 text-sm">
          {/* 🔹 Renderizar las reacciones */}
          {fieldReaction?.reactions.map((reaction) => {
            const isActive = fieldReaction.user_reaction === reaction.id;
            return (
              <button
                key={reaction.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  mutation.mutate(reaction.id);
                }}
                className={`flex items-center gap-1 transition ${
                  isActive
                    ? "opacity-100 scale-105"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={reaction.icon_url}
                  alt={reaction.label}
                  width={16}
                  height={16}
                  className="rounded-full"
                />
                <span>{reaction.count}</span>
              </button>
            );
          })}

          {/* Comentarios */}
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsCommentsOpen(true);
              }}
              className="flex items-center gap-1"
              aria-label="Abrir comentarios"
            >
              <MessageCircle size={16} />
              <span>{totalComments}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de galería */}
      {isOpen && (
        <GalleryModal
          images={images}
          initialIndex={startIndex}
          onClose={() => setIsOpen(false)}
        />
      )}

      {/* Modal de comentarios */}
      <Dialog
        open={isCommentsOpen}
        onOpenChange={(open) => setIsCommentsOpen(open)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-normal">Comentarios</DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            <PublicationComments
              publicationId={publication.id}
              publication={publication}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
