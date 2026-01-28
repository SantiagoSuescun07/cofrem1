import { useQuery } from "@tanstack/react-query";
import { getUserProfile } from "@/services/profile/get-user-profile";

export const useUserProfile = (userId: string) => {
  return useQuery({
    queryKey: ["user-profile", userId],
    queryFn: () => getUserProfile(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 min
    retry: 2
  });
};
