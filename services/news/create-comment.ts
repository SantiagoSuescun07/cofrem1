import api from "@/lib/axios";

// Function to create a comment
export const createComment = async (newsNid: number, commentBody: string) => {
  const payload = {
    entity_id: [
      {
        target_id: newsNid,
      },
    ],
    entity_type: [
      {
        value: "node",
      },
    ],
    comment_type: [
      {
        target_id: "comment",
      },
    ],
    field_name: [
      {
        value: "comment",
      },
    ],
    field_body_default: [
      {
        value: commentBody,
      },
    ],
  };

  await api.post("/comment?_format=json", payload, {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + btoa("admin:admin"), // Basic Auth with admin:admin
    },
  });
};
