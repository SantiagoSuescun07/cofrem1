import { COMMENTS_QUERY_KEY, NEWS_QUERY_KEY } from "@/constants/query-keys";
import { createComment } from "@/services/news/create-comment";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Mutation hook for creating comments
export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      newsNid,
      commentBody,
    }: {
      newsNid: number;
      commentBody: string;
    }) => createComment(newsNid, commentBody),
    onSuccess: (newComment, variables) => {
      // Refetch comments for the specific news item
      queryClient.refetchQueries({
        queryKey: [COMMENTS_QUERY_KEY],
        exact: false, // Ensure exact match
      });

      // Optionally refetch news to update comment_count
      queryClient.refetchQueries({
        queryKey: [NEWS_QUERY_KEY],
        exact: false,
      });
    },
    onError: (error) => {
      console.error("Error creating comment:", error);
    },
  });
};
