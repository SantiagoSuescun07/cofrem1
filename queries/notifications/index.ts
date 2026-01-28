import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotifications } from "@/services/notifications/get-notifications";
import { markNotificationAsRead } from "@/services/notifications/mark-notification-read";

export const NOTIFICATIONS_QUERY_KEY = "notifications";

export const useNotifications = () => {
  return useQuery({
    queryKey: [NOTIFICATIONS_QUERY_KEY],
    queryFn: getNotifications,
    staleTime: 1 * 60 * 1000, // 1 minuto
    refetchOnWindowFocus: true,
    refetchInterval: 2 * 60 * 1000, // Refrescar cada 2 minutos
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      markNotificationAsRead(notificationId),
    onSuccess: () => {
      // Refrescar las notificaciones después de marcar como leída
      queryClient.invalidateQueries({
        queryKey: [NOTIFICATIONS_QUERY_KEY],
      });
    },
  });
};

