"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useComments } from "@/queries/news";
import { News } from "@/types/news/news";
import { formatDate } from "@/utils/format-date";
import { MessageCircle, User } from "lucide-react";
import { CommentForm } from "./comments-form";
import { useState } from "react";
import { Pagination } from "@/components/common/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ArticleCommentsProps {
  newsId: string;
  news: News;
  commentsClassName?: string;
}

export function ArticleComments({
  newsId,
  news,
  commentsClassName,
}: ArticleCommentsProps) {
  const [page, setPage] = useState(1); // State to track current page
  const [limit, setLimit] = useState(5); // State to track comments per page

  const {
    data: allComments,
    isLoading: commentsLoading,
    isError: commentsError,
  } = useComments(newsId);

  const totalComments = allComments?.length || 0;
  const totalPages = Math.ceil(totalComments / limit);

  // Paginate client-side
  const paginatedComments = allComments
    ? allComments.slice((page - 1) * limit, page * limit)
    : [];

  // Reset to page 1 when limit changes
  const handleLimitChange = (value: string) => {
    setLimit(parseInt(value));
    setPage(1); // Reset to first page
  };

  return (
    <Card className="max-md:border-0 max-md:px-0 max-md:shadow-none mt-6">
      <CardContent className="md:p-4 p-0 py-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Comentarios</h3>
          <Badge variant="outline" className="text-sm">
            {news?.comments.comment_count} comentarios
          </Badge>
        </div>

        <div className="mb-4">
          <CommentForm nid={news.drupal_internal__nid} />
        </div>

        {/* Loading Comments */}
        {commentsLoading && (
          <div className="text-center py-6 text-muted-foreground">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Cargando comentarios...</p>
          </div>
        )}

        {/* Error Comments */}
        {commentsError && (
          <div className="text-center py-6 text-red-500">
            <p className="text-sm">Error al cargar los comentarios</p>
          </div>
        )}

        {/* Comments List */}
        {!commentsLoading && !commentsError && paginatedComments && (
          <div className="space-y-3 mb-4">
            {paginatedComments.length > 0 ? (
              paginatedComments.map((comment) => (
                <div
                  key={comment.id}
                  className="border-l-4 border-primary/30 pl-4 pr-3 py-3 bg-gradient-to-r from-muted/50 to-transparent rounded-r-lg hover:from-muted/70 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-primary/15 rounded-full flex items-center justify-center ring-2 ring-primary/20">
                      <User className="h-4 w-4 text-primary" />
                    </div>

                    <div>
                      <p className="font-semibold text-sm text-foreground">
                        {comment.user?.name || "Usuario"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(comment.created)}
                      </p>
                    </div>
                  </div>
                  <p className="text-foreground leading-relaxed text-sm ml-10">
                    {comment.body}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground border border-dashed border-muted rounded-lg">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay comentarios aún</p>
              </div>
            )}
          </div>
        )}

        {/* Pagination and Limit Selector - Only show if there are comments */}
        {!commentsLoading && !commentsError && totalComments > 0 && (
          <div
            className={cn(
              "flex flex-col md:flex-row md:items-center md:justify-between items-start gap-4 pt-4 border-t border-muted",
              commentsClassName
            )}
          >
            <Select
              onValueChange={handleLimitChange}
              defaultValue={limit.toString()}
            >
              <SelectTrigger className="w-[180px] bg-white">
                <SelectValue placeholder="Comentarios por página" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 por página</SelectItem>
                <SelectItem value="10">10 por página</SelectItem>
                <SelectItem value="15">15 por página</SelectItem>
              </SelectContent>
            </Select>
            {totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
