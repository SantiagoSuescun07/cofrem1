import api from "@/lib/axios";

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  await api.post(
    `/api/user/notifications/${notificationId}/read?_format=json`,
    {},
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};

