import { BANNER_QUERY_KEY } from "@/constants/query-keys";
import { fetchBanner } from "@/services/banner/get-banner-info";
import { useQuery } from "@tanstack/react-query";
import { useHasToken } from "@/hooks/use-has-token";

export const useBanner = () => {
  const hasToken = useHasToken();

  return useQuery({
    queryKey: [BANNER_QUERY_KEY],
    queryFn: () => fetchBanner(),
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    retry: 2, // Reintenta hasta 2 veces
    enabled: hasToken, // Solo ejecutar si hay token
  });
};
