import api from "@/lib/axios";
import { Notification } from "@/types/notifications";

export const getNotifications = async (): Promise<Notification[]> => {
  const response = await api.get<Notification[]>("/api/user/notifications?_format=json", {
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response.data;
};

