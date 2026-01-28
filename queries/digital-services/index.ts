import { fetchDigitalServices } from "@/services/digital-services/get-digital-services";
import { fetchDigitalServiceNode } from "@/services/digital-services/get-digital-service-node";
import { useQuery } from "@tanstack/react-query";
import { DIGITAL_SERVICE_NODE_KEY } from "@/constants/query-keys";
import { useHasToken } from "@/hooks/use-has-token";

export const useDigitalServicesQuery = () => {
  const hasToken = useHasToken();

  return useQuery({
    queryKey: ["digital-services"],
    queryFn: fetchDigitalServices,
    staleTime: 1000 * 60 * 10, // 10 minutos
    enabled: hasToken, // Solo ejecutar si hay token
  });
};

export const useDigitalServiceNodeQuery = (nodeId: string) => {
  return useQuery({
    queryKey: [DIGITAL_SERVICE_NODE_KEY, nodeId],
    queryFn: () => fetchDigitalServiceNode(nodeId),
    staleTime: 1000 * 60 * 10, // 10 minutos
    enabled: !!nodeId, // Solo fetch si hay nodeId
  });
};
