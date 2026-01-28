import { useQuery } from "@tanstack/react-query";
import { fetchNotificationEntity } from "@/services/notifications/get-notification-entity";

export const NOTIFICATION_ENTITY_QUERY_KEY = "notification-entity";

export const useNotificationEntity = (
  notificationLink: string | null,
  entityBundle?: string
) => {
  return useQuery({
    queryKey: [NOTIFICATION_ENTITY_QUERY_KEY, notificationLink, entityBundle],
    queryFn: () => fetchNotificationEntity(notificationLink!, entityBundle),
    enabled: !!notificationLink,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });
};
