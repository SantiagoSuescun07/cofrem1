import api from "@/lib/axios";

export const updateRanking = async (
  gameId: number,
  points: number
): Promise<boolean> => {
  try {
    await api.post(
      "/api/ranking/update",
      {
        game_id: gameId,
        points: points,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + btoa("admin:admin"),
        },
      }
    );

    return true;
  } catch (error: any) {
    // Si el endpoint no existe (404) o hay un error del servidor (400, 500), 
    // lo manejamos silenciosamente ya que es una operación secundaria
    if (error?.response?.status === 404) {
      console.warn("Endpoint de ranking no disponible aún - el ranking se actualizará automáticamente");
    } else if (error?.response?.status === 400) {
      console.warn("Error en la solicitud de ranking - verificar parámetros del servidor");
    } else {
      console.warn("Error al actualizar el ranking:", error?.message || error);
    }
    return false;
  }
};
