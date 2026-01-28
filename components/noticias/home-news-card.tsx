"use client";

import { News } from "@/types/news/news";
import { MessageCircle } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArticleComments } from "@/app/(dashboard)/noticias/[newsId]/_components/article-comments";
import { ProgressBar } from "../common/progress-bar";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createReaction } from "@/services/news/reactions";
import { toast } from "sonner";
import { getNewsReactions } from "@/queries/news";

interface HomeNewsCardProps {
  news: News;
}

export function HomeNewsCard({ news }: HomeNewsCardProps) {
  const queryClient = useQueryClient();

  // Obtener reacciones de la noticia
  const { data } = getNewsReactions(news.drupal_internal__nid.toString());

  // Mutación para registrar una reacción
  const mutation = useMutation({
    mutationFn: (reactionType: string) =>
      createReaction(
        news.drupal_internal__nid.toString(),
        "field_reaction",
        reactionType
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["reactions", news.drupal_internal__nid.toString()],
      });
    },
    onError: () => toast.error("No se pudo registrar tu reacción"),
  });

  const mainImage = news.field_main_image?.url || "";
  const commentsCount = news.comments.comment_count;
  const fieldReaction = data?.fields.find(
    (f) => f.field_name === "field_reaction"
  );
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-md mb-5 overflow-hidden transition-shadow hover:shadow-lg">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Image
              src="/icons/blue-news.png"
              alt="News icon"
              width={40}
              height={40}
              priority
              className="size-[25px] object-cover"
            />
            <h3 className="text-2xl">Noticias</h3>
          </div>
          <ProgressBar />
        </div>

        {/* Título */}
        <h2 className="text-gray-700 text-sm leading-relaxed mb-4">
          {news.title}
        </h2>

        {/* Imagen principal */}
        {mainImage && (
          <div className="rounded-xl overflow-hidden mb-4">
            <Image
              src={mainImage}
              alt={news.field_main_image?.alt || news.title}
              width={400}
              height={256}
              priority
              className="w-full h-120  object-cover "
            />
          </div>
        )}

        {/* Footer */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            {news.field_segmentation.length > 0 && (
              <span className="text-xs text-[#335d79] font-medium px-3 py-1.5 bg-[#daebff] rounded-full">
                {news.field_segmentation[0].name}
              </span>
            )}

            <Link
              href={`/noticias/${news.id}`}
              className="bg-[#00a2f1] hover:bg-[#0085c8] text-white text-sm font-medium px-5 py-2 rounded-xl transition-colors"
            >
              Ver más
            </Link>
          </div>

          {/* Reacciones y comentarios */}
          <div className="flex items-center gap-4">
            {/* 🔹 Renderizar las reacciones */}
            {fieldReaction?.reactions.map((reaction) => {
              const isActive = fieldReaction.user_reaction === reaction.id;
              return (
                <button
                  key={reaction.id}
                  onClick={() => mutation.mutate(reaction.id)}
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
                    className="rounded-full"
                  />
                  <span className="text-sm font-medium">{reaction.count}</span>
                </button>
              );
            })}

            {/* Comentarios */}
            <div className="flex items-center gap-1 text-gray-600">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsCommentsOpen(true);
                }}
                className="flex items-center gap-1"
                aria-label="Abrir comentarios"
              >
                <MessageCircle className="w-5 h-5 text-[#8fd0e2]" />
                <span className="text-sm font-medium">{commentsCount}</span>
              </button>
            </div>
          </div>
          {/* Modal de comentarios */}
          <Dialog open={isCommentsOpen} onOpenChange={(open) => setIsCommentsOpen(open)}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
              <DialogHeader>
                <DialogTitle className="font-normal">Comentarios</DialogTitle>
              </DialogHeader>

              <div className="mt-4 max-w-full">
                <ArticleComments newsId={news.id} news={news} commentsClassName="md:flex-col md:items-center md:justify-center" />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
