import { useQuery } from "@tanstack/react-query";
import { fetchNews } from "@/services/news/get-news";
import { fetchSingleNews } from "@/services/news/get-a-single-news-item";
import {
  COMMENTS_QUERY_KEY,
  NEWS_QUERY_KEY,
  SINGLE_NEWS_KEY,
} from "@/constants/query-keys";
import { fetchComments } from "@/services/news/get-comments";
import { getReactions } from "@/services/news/reactions";
import { useHasToken } from "@/hooks/use-has-token";

export const useNews = (page: number = 1) => {
  const hasToken = useHasToken();

  return useQuery({
    queryKey: [NEWS_QUERY_KEY, page], // Unique key for caching, invalidates on page change
    queryFn: () => fetchNews(),
    staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
    retry: 2, // Retry failed requests up to 2 times
    enabled: hasToken, // Solo ejecutar si hay token
  });
};

// React Query hook for fetching a single news item
export const useSingleNews = (id: string) => {
  return useQuery({
    queryKey: [SINGLE_NEWS_KEY, id], // Unique key for caching, tied to news ID
    queryFn: () => fetchSingleNews(id),
    staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
    retry: 2, // Retry failed requests up to 2 times
    enabled: !!id, // Only fetch if ID is provided
  });
};

// React Query hook for fetching comments
export const useComments = (newsId: string, page: number = 1) => {
  return useQuery({
    queryKey: [COMMENTS_QUERY_KEY, newsId, page], // Include page in query key for caching
    queryFn: () => fetchComments(newsId),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    enabled: !!newsId,
  });
};

export const getNewsReactions = (id: string) => {
  return useQuery({
    queryKey: ["reactions", id],
    queryFn: () => getReactions(id),
  });
};
