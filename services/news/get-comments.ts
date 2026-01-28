import api from "@/lib/axios";
import { Comment } from "@/types/news/news";

// Fetch function for comments of a specific news item with pagination
// export const fetchComments = async (
//   newsId: string,
//   page: number = 1
// ): Promise<{ comments: Comment[]; totalPages: number }> => {
//   const limit = 2; // Match the limit used in fetchNews
//   const offset = (page - 1) * limit;

//   const response = await api.get("/jsonapi/comment/comment", {
//     params: {
//       "filter[entity_id.id]": newsId,
//       include: "uid", // Include user data
//       "page[offset]": offset,
//       "page[limit]": limit,
//       sort: "-created", // Sort by created date in descending order (newest first)
//     },
//   });

//   // Create a map for included user entities
//   const includedById = new Map<string, any>();
//   if (response.data.included) {
//     response.data.included.forEach((included: any) => {
//       if (included.type === "user--user") {
//         includedById.set(included.id, included);
//       }
//     });
//   }

//   const comments = response.data.data.map((item: any) => {
//     const userData = item.relationships.uid?.data;
//     const userIncluded = userData ? includedById.get(userData.id) : null;
//     const user = userIncluded
//       ? {
//           id: userIncluded.id,
//           name: userIncluded.attributes.name || "Anónimo", // Fallback to 'Anónimo' if name is null
//         }
//       : null;

//     return {
//       id: item.id,
//       body: item.attributes.field_body_default,
//       created: item.attributes.created,
//       user,
//     };
//   });

//   const totalItems = response.data.meta?.count || 0; // Total number of comments for pagination
//   const totalPages = Math.ceil(totalItems / limit);

//   return {
//     comments,
//     totalPages,
//   };
// };

export const fetchComments = async (newsId: string): Promise<Comment[]> => {
  const response = await api.get("/jsonapi/comment/comment", {
    params: {
      "filter[entity_id.id]": newsId,
      include: "uid", // Include user data
      sort: "-created", // Sort by created date in descending order (newest first)
      // No pagination params to fetch all comments
    },
  });

  console.log("API Response (all comments):", response.data); // Debug log

  // Create a map for included user entities
  const includedById = new Map<string, any>();
  if (response.data.included) {
    response.data.included.forEach((included: any) => {
      if (included.type === "user--user") {
        includedById.set(included.id, included);
      }
    });
  }

  let comments = response.data.data.map((item: any) => {
    const userData = item.relationships.uid?.data;
    const userIncluded = userData ? includedById.get(userData.id) : null;
    const user = userIncluded
      ? {
          id: userIncluded.id,
          name: userIncluded.attributes.name || "Anónimo", // Fallback to 'Anónimo' if name is null
        }
      : null;

    return {
      id: item.id,
      body: item.attributes.field_body_default,
      created: item.attributes.created,
      user,
    };
  });

  // Ensure client-side sorting by created descending (newest first), in case API sort fails
  // comments.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

  console.log("Total Comments Fetched:", comments.length); // Debug log

  return comments;
};