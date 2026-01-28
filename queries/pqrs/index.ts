// hooks/usePqrsQuery.js
import { PQRS_QUERY_KEY } from "@/constants/query-keys";
import { getPqrs } from "@/services/pqrs/get-list-pqrs";
import { getDependencies, getPqrsTypes, getUrgencyLevels } from "@/services/pqrs/taxonomy-get";
import { useQuery } from "@tanstack/react-query";

export const usePqrsQuery = () => {
  return useQuery({
    queryKey: [PQRS_QUERY_KEY],
    queryFn: getPqrs,
  });
};

export const usePqrsTypes = () =>
  useQuery({
    queryKey: ["pqrsTypes"],
    queryFn: getPqrsTypes,
  });

export const useUrgencyLevels = () =>
  useQuery({
    queryKey: ["urgencyLevels"],
    queryFn: getUrgencyLevels,
  });

export const useDependencies = () =>
  useQuery({
    queryKey: ["dependencies"],
    queryFn: getDependencies,
  });
