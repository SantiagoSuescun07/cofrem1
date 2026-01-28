import { useQuery } from "@tanstack/react-query";
import { fetchNewsletters } from "@/services/newsletters/get-newsletters";
import { REPORTS_QUERY_KEY, SINGLE_REPORT_KEY } from "@/constants/query-keys";
import { fetchSingleNewsletter } from "@/services/newsletters/get-single-newsletter";

export const useNewsletters = () => {
  return useQuery({
    queryKey: [REPORTS_QUERY_KEY],
    queryFn: fetchNewsletters,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};

export const useSingleNewsletter = (id: string) => {
  return useQuery({
    queryKey: [SINGLE_REPORT_KEY, id],
    queryFn: () => fetchSingleNewsletter(id),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    enabled: !!id,
  });
};
