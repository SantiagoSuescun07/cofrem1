import { Badge } from "@/components/ui/badge";
import { News } from "@/types/news/news";
import { formatDate } from "@/utils/format-date";
import { Calendar, Eye, MessageCircle, User } from "lucide-react";

interface ArticleHeaderProps {
  news: News;
}

export function ArticleHeader({ news }: ArticleHeaderProps) {
  return (
    <div className="mb-8">
      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-4">
        {news?.field_segmentation.map((segment) => (
          <Badge key={segment.id} variant="secondary">
            {segment.name}
          </Badge>
        ))}
        {/* {news?.field_publication_statuses && (
          <Badge variant="outline" className="gap-1">
            <Eye className="h-3 w-3" />
            {news.field_publication_statuses.name}
          </Badge>
        )} */}
      </div>

      {/* Title */}
      <h1 className="text-4xl text-foreground mb-4 text-balance">
        {news?.title}
      </h1>

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          <span>{formatDate(news!.created)}</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageCircle className="h-4 w-4" />
          <span>{news?.comments.comment_count} comentarios</span>
        </div>
        {news?.comments.last_comment_name && (
          <div className="flex items-center gap-1">
            <User className="h-4 w-4" />
            <span>Último comentario: {news?.comments.last_comment_name}</span>
          </div>
        )}
      </div>
    </div>
  );
}
