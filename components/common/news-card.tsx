// components/news/NewsCard.tsx
import React from 'react';
import { Heart, MessageCircle, Star } from 'lucide-react';
import { CategoryBadge } from '@/components/common/category-badge';
import { NewsItem } from '@/types';

interface NewsCardProps {
  news: NewsItem;
  compact?: boolean;
  onReadMore?: (newsId: number) => void;
  onReaction?: (newsId: number) => void;
  onComment?: (newsId: number) => void;
}

export const NewsCard: React.FC<NewsCardProps> = ({ 
  news, 
  compact = false, 
  onReadMore, 
  onReaction, 
  onComment 
}) => {
  const handleReadMore = (): void => {
    if (onReadMore) {
      onReadMore(news.id);
    }
  };

  const handleReaction = (): void => {
    if (onReaction) {
      onReaction(news.id);
    }
  };

  const handleComment = (): void => {
    if (onComment) {
      onComment(news.id);
    }
  };

  return (
    <article className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <CategoryBadge category={news.category} />
          {news.priority === 'high' && (
            <Star size={14} className="text-yellow-500" />
          )}
        </div>
        <span className="text-xs text-gray-500">{news.date}</span>
      </div>
      
      <h3 className={`font-semibold text-gray-900 mb-2 ${compact ? 'text-base' : 'text-xl'}`}>
        {news.title}
      </h3>
      
      <p className="text-gray-600 text-sm mb-4">{news.summary}</p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <span>{compact ? '' : 'Por: '}{news.author}</span>
          <button 
            onClick={handleReaction}
            className="flex items-center hover:text-red-500 transition-colors"
            aria-label={`${news.reactions} reacciones`}
          >
            <Heart size={12} className="mr-1" />
            <span>{news.reactions}</span>
          </button>
          <button 
            onClick={handleComment}
            className="flex items-center hover:text-blue-500 transition-colors"
            aria-label={`${news.comments} comentarios`}
          >
            <MessageCircle size={12} className="mr-1" />
            <span>{news.comments}</span>
          </button>
        </div>
        <button 
          onClick={handleReadMore}
          className="text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors"
        >
          Leer más
        </button>
      </div>
    </article>
  );
};