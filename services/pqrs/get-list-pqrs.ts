import api from "@/lib/axios";
import { PqrsResponse } from "@/types/pqrs";

export const getPqrs = async () => {
  const response = await api.get<PqrsResponse>("/api/pqrs?_format=json", {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + btoa("admin:admin"), 
    },
  });

  return response.data; 
};

