"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { News } from "@/types/news/news";
import {  useMutation, useQueryClient } from "@tanstack/react-query";
import { createReaction } from "@/services/news/reactions";
import { toast } from "sonner";
import { getNewsReactions } from "@/queries/news";
import { GalleryModal } from "@/components/common/gallery-modal";

interface NewsCardProps {
  news: News;
}

export function NewsCard({ news }: NewsCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  const { data } = getNewsReactions(news.drupal_internal__nid.toString())

  const mutation = useMutation({
    mutationFn: (reactionType: string) =>
      createReaction(news.drupal_internal__nid.toString(), "field_reaction", reactionType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reactions", news.drupal_internal__nid.toString()] });
    },
    onError: () => toast.error("No se pudo registrar tu reacción"),
  });

  const stripHtml = (html: string) =>
    html.replace(/<[^>]*>/g, "").substring(0, 200) + "...";

  const fieldReaction = data?.fields.find(
    (f) => f.field_name === "field_reaction"
  );

  // Combinar imagen principal + galería
  const allImages = [
    ...(news.field_main_image ? [news.field_main_image] : []),
    ...(news.field_gallery || []),
  ];

  const openGallery = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setStartIndex(0);
    setIsGalleryOpen(true);
  };

  return (
    <div
      onClick={() => router.push(`/noticias/${news.id}`)}
      className="relative w-full border rounded-2xl p-4 shadow-sm hover:shadow-md transition cursor-pointer bg-white"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        {news.field_segmentation.length > 0 && (
          <Badge className="bg-[#daebff] text-[#335d79] rounded-full px-3 py-1.5 text-xs font-medium">
            {news.field_segmentation[0].name}
          </Badge>
        )}
        <div className="text-right text-sm text-gray-500">
          {new Date(news.created).toISOString().split("T")[0]}
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div 
          className="relative w-full sm:w-40 h-40 shrink-0 rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
          onClick={allImages.length > 0 ? openGallery : undefined}
        >
          {news.field_main_image && (
            <Image
              src={news.field_main_image.url || "/placeholder.svg"}
              alt={news.field_main_image.alt || news.title}
              fill
              className="object-cover"
            />
          )}
        </div>

        <div className="flex flex-col flex-1">
          <h3 className="text-lg mb-2">{news.title}</h3>
          <p className="text-gray-600 text-sm flex-1">{stripHtml(news.body)}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 text-sm">
        <div className="flex items-center gap-4">
          {/* 🔹 Renderizar las reacciones */}
          {fieldReaction?.reactions.map((reaction) => {
            const isActive = fieldReaction.user_reaction === reaction.id;
            return (
              <button
                key={reaction.id}
                onClick={(e) => {
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
                  width={22}
                  height={22}
                  className="rounded-full object-center"
                />
                <span>{reaction.count}</span>
              </button>
            );
          })}

          {/* Comentarios */}
          <div className="flex items-center gap-1">
            <MessageCircle className="size-5 stroke-2 text-[#8fd0e2]" />
            <span>{news.comments.comment_count || 0}</span>
          </div>
        </div>

        <Link
          href={`/noticias/${news.id}`}
          className="text-[#24b0d6] font-semibold hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          Leer más...
        </Link>
      </div>

      {/* Modal de galería */}
      {isGalleryOpen && allImages.length > 0 && (
        <GalleryModal
          images={allImages}
          initialIndex={startIndex}
          onClose={() => setIsGalleryOpen(false)}
        />
      )}
    </div>
  );
}
