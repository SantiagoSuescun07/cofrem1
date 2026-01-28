import { useQuery } from "@tanstack/react-query";
import { fetchPublications } from "@/services/publications/get-publications";
import { PUBLICATIONS_QUERY_KEY, SINGLE_PUBLICATION_KEY } from "@/constants/query-keys";
import { fetchSinglePublication } from "@/services/publications/get-single-publication";
import { getReactions } from "@/services/news/reactions";

export const usePublications = () => {
  return useQuery({
    queryKey: [PUBLICATIONS_QUERY_KEY],
    queryFn: () => fetchPublications(),
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
};

export const useSinglePublication = (id: string) => {
  return useQuery({
    queryKey: [SINGLE_PUBLICATION_KEY, id],
    queryFn: () => fetchSinglePublication(id),
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
    enabled: !!id, // Solo si hay id
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
};

export const getPublicationsReactions = (id: string) => {
  return useQuery({
    queryKey: ["reactions", id],
    queryFn: () => getReactions(id),
    enabled: !!id, // Solo si hay id
  });
};
