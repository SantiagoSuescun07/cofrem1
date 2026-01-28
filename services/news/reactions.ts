import api from "@/lib/axios"; // o la ruta donde está tu instancia axios

export interface ReactionType {
  id: string;
  label: string;
  icon_url: string;
  count: number;
}

export interface ReactionField {
  field_name: string;
  user_reaction: string | null;
  reactions: ReactionType[];
}

export interface ReactionResponse {
  entity_type: string;
  entity_id: string;
  fields: ReactionField[];
}

// 🔹 Obtener reacciones de una noticia
export async function getReactions(
  entityId: string
): Promise<ReactionResponse> {
  const { data } = await api.get<ReactionResponse>(
    `/api/reactions/node/${entityId}`
  );
  return data;
}

// 🔹 Crear o actualizar una reacción
export async function createReaction(
  entityId: string,
  fieldName: string,
  reactionType: string
): Promise<void> {
  await api.patch(`/api/reactions/node/${entityId}`, {
    field_name: fieldName,
    reaction_type: reactionType,
  });
}
