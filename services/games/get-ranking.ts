import api from "@/lib/axios";
import { RankingResponse } from "@/types/games";

export const fetchRanking = async (type: string = "general"): Promise<RankingResponse | null> => {
  try {
    const response = await api.get("/api/ranking", {
      params: { type },
      headers: {
        Authorization: "Basic " + btoa("admin:admin"),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching ranking:", error);
    return null;
  }
};

