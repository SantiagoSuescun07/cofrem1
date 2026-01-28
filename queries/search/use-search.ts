import { useQuery } from "@tanstack/react-query";
import { searchContent, SearchResponse } from "@/services/search/search-content";

export function useSearch(query: string) {
  return useQuery<SearchResponse>({
    queryKey: ["search", query],
    queryFn: () => searchContent(query),
    enabled: query.trim().length >= 2,
    staleTime: 30000, // Cache por 30 segundos
  });
}

