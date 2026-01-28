import { useQuery, useQueries } from "@tanstack/react-query";
import { fetchCampaigns } from "@/services/games/get-campaigns";
import { fetchCampaign } from "@/services/games/get-campaign";
import { fetchGameDetails } from "@/services/games/get-game-details";
import { fetchRanking } from "@/services/games/get-ranking";
import {
  CAMPAIGNS_QUERY_KEY,
  GAME_DETAILS_QUERY_KEY,
  SINGLE_CAMPAIGN_KEY,
  RANKING_QUERY_KEY,
} from "@/constants/query-keys";

export const useCampaigns = () => {
  return useQuery({
    queryKey: [CAMPAIGNS_QUERY_KEY],
    queryFn: () => fetchCampaigns(),
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });
};

export const useCampaign = (campaignId: string | null) => {
  return useQuery({
    queryKey: [SINGLE_CAMPAIGN_KEY, campaignId],
    queryFn: () => fetchCampaign(campaignId!),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    enabled: !!campaignId,
  });
};

export const useGameDetails = (gameUrl: string | null) => {
  return useQuery({
    queryKey: [GAME_DETAILS_QUERY_KEY, gameUrl],
    queryFn: () => fetchGameDetails(gameUrl!),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    enabled: !!gameUrl,
  });
};

export const useRanking = (type: string = "general") => {
  return useQuery({
    queryKey: [RANKING_QUERY_KEY, type],
    queryFn: () => fetchRanking(type),
    staleTime: 2 * 60 * 1000, // 2 minutos (más frecuente que campañas)
    retry: 2,
  });
};

// Hook para cargar múltiples detalles de juegos en paralelo usando React Query
export const useGameDetailsBatch = (gameTypes: Array<{ id: string; href: string }> | null) => {
  // Filtrar solo los juegos que tienen href
  const validGameTypes = gameTypes?.filter((gt) => gt.href) || [];
  
  const queries = useQueries({
    queries: validGameTypes.map((gameType) => ({
      queryKey: [GAME_DETAILS_QUERY_KEY, gameType.href, gameType.id],
      queryFn: () => fetchGameDetails(gameType.href),
      staleTime: 5 * 60 * 1000, // 5 minutos - los datos se mantienen frescos por 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos - los datos en caché se mantienen por 10 minutos
      retry: 2,
      enabled: !!gameType.href,
    })),
  });

  // Construir un mapa de detalles de juegos por ID
  const gameDetailsMap: Record<string, any> = {};
  const loadingGames = new Set<string>();
  const errorGames = new Set<string>();
  const refetchMap: Record<string, () => void> = {};
  
  validGameTypes.forEach((gameType, index) => {
    const query = queries[index];
    if (query) {
      if (query.isLoading || query.isFetching) {
        loadingGames.add(gameType.id);
      }
      if (query.isError) {
        errorGames.add(gameType.id);
      }
      if (query.data) {
        gameDetailsMap[gameType.id] = query.data;
      }
      // Guardar la función de refetch para este juego
      if (query.refetch) {
        refetchMap[gameType.id] = () => query.refetch();
      }
    }
  });

  const isLoading = queries.some((query) => query.isLoading);
  const hasError = queries.some((query) => query.isError);

  return {
    gameDetailsMap,
    loadingGames,
    errorGames,
    refetchMap,
    isLoading,
    hasError,
    queries,
  };
};

