import { useQuery } from "@tanstack/react-query";
import { fetchLatestGamificationBanner } from "@/services/gamification/get-latest-campaign";

export const useGamificationBannerQuery = () => {
  return useQuery({
    queryKey: ["gamification-banner"],
    queryFn: fetchLatestGamificationBanner,
  });
};
