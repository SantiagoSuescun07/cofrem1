import { useQuery } from "@tanstack/react-query";
import { getBirthdays } from "@/services/birthday/get-birthdays";

export const useBirthdayQuery = () => {
  return useQuery({
    queryKey: ["birthdays"],
    queryFn: getBirthdays,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};
