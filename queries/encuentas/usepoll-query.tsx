import api from "@/lib/axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Poll {
  id: string | number;
  question: string;
  options: Array<{
    id: number;
    label: string;
  }>;
  allow_anonymous: string;
  allow_cancel: string;
  allow_view_results: string;
  has_user_voted: boolean;
  fields?: {
    field_title?: Array<{
      value: string;
    }>;
  };
  results?: {
    total_votes: number;
    choices: Array<{
      id: number;
      label: string;
      votes: string;
      percentage: number;
    }>;
  };
}

export const usePollQuery = () => {
  return useQuery({
    queryKey: ["poll"],
    queryFn: async () => {
      try {
        const { data } = await api.get<Poll[]>(`/api/poll`);
        return data;
      } catch (error: any) {
        // Si es un 404, significa que no hay encuestas activas
        if (error.response?.status === 404) {
          return [];
        }
        // Para otros errores, lanzar el error normalmente
        throw error;
      }
    },
  });
};

interface VoteParams {
  pollId: string | number;
  choiceId?: string | number;
  cancel?: boolean;
}

export const useVoteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ pollId, choiceId, cancel }: VoteParams) => {
      const payload: any = { poll_id: Number(pollId) };
      if (cancel) {
        payload.cancel = true;
      } else if (choiceId) {
        payload.choice_id = Number(choiceId);
      }
      await api.post(`/api/poll/vote`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["poll"] });
    },
  });
};
