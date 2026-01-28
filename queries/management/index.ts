import { useQuery } from "@tanstack/react-query";
import { fetchDocuments } from "@/services/management/get-documents";
import { fetchModules } from "@/services/management/get-taxonomy";
import { DOCUMENTS_QUERY_KEY } from "@/constants/query-keys";

export const useDocuments = () => {
  return useQuery({
    queryKey: [DOCUMENTS_QUERY_KEY],
    queryFn: () => fetchDocuments(),
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: (failureCount, error: any) => {
      // No reintentar si es un error 400 o 404, ya que son errores de configuración
      if (error?.response?.status === 400 || error?.response?.status === 404) {
        return false;
      }
      // Reintentar hasta 2 veces para otros errores
      return failureCount < 2;
    },
    retryDelay: 1000,
  });
};

export const useModules = () => {
  return useQuery({
    queryKey: ["modules-management"],
    queryFn: () => fetchModules(),
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });
};

