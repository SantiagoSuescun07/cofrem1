"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useComments } from "@/queries/news";
import { Publication } from "@/types/publications";
import { formatDate } from "@/utils/format-date";
import { MessageCircle, User } from "lucide-react";
import { PublicationCommentForm } from "./publication-comments-form";
import { useState } from "react";
import { Pagination } from "@/components/common/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PublicationCommentsProps {
  publicationId: string;
  publication: Publication;
}

export function PublicationComments({
  publicationId,
  publication,
}: PublicationCommentsProps) {
  const [page, setPage] = useState(1); // State to track current page
  const [limit, setLimit] = useState(5); // State to track comments per page

  const {
    data: allComments,
    isLoading: commentsLoading,
    isError: commentsError,
  } = useComments(publicationId);

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
    <Card className="max-md:border-0 max-md:px-0 max-md:shadow-none">
      <CardContent className="md:p-6 p-0 py-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl">Comentarios</h3>
          <Badge variant="outline">{totalComments} comentarios</Badge>
        </div>

        <div className="text-center py-4">
          <PublicationCommentForm nid={publication.drupal_internal__nid} />
        </div>

        {/* Loading Comments */}
        {commentsLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Cargando comentarios...</p>
          </div>
        )}

        {/* Error Comments */}
        {commentsError && (
          <div className="text-center py-8 text-red-500">
            <p>Error al cargar los comentarios</p>
          </div>
        )}

        {/* Comments List */}
        {!commentsLoading && !commentsError && paginatedComments && (
          <div className="space-y-4">
            {paginatedComments.length > 0 ? (
              paginatedComments.map((comment) => (
                <div
                  key={comment.id}
                  className="border-l-2 border-muted pl-4 bg-muted rounded-xl py-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>

                    <div>
                      <p className="font-medium text-sm">
                        {comment.user?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(comment.created)}
                      </p>
                    </div>
                  </div>
                  <p className="text-foreground leading-relaxed mr-4 md:mx-10">
                    {comment.body}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay comentarios aún</p>
              </div>
            )}
          </div>
        )}

        {/* Pagination and Limit Selector */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between items-start mt-12">
          {allComments && allComments?.length > 0 && (
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
          )}
          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
