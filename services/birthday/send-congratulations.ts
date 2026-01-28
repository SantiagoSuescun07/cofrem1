import api from "@/lib/axios";

export interface SendCongratulationsParams {
  user_id: number;
  message: string;
  image_id?: number;
}

/**
 * Sube una imagen para usar en la felicitación de cumpleaños
 */
export const uploadBirthdayImage = async (file: File): Promise<number> => {
  const arrayBuffer = await file.arrayBuffer();
  const binaryData = new Uint8Array(arrayBuffer);

  const response = await api.post(
    "/file/upload/media/image/field_media_image",
    binaryData,
    {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `file; filename="${file.name}"`,
      },
    }
  );

  // El endpoint devuelve el ID del archivo
  // Puede venir en diferentes formatos según la respuesta del backend
  const fileId = 
    response.data?.fid?.[0]?.value || 
    response.data?.id || 
    response.data?.fid ||
    response.data;

  if (!fileId) {
    console.error("Respuesta del servidor:", response.data);
    throw new Error("No se pudo obtener el ID del archivo subido.");
  }

  // Convertir a número si es necesario
  const numericId = typeof fileId === 'number' ? fileId : parseInt(String(fileId), 10);
  
  if (isNaN(numericId)) {
    throw new Error(`ID de archivo inválido: ${fileId}`);
  }

  return numericId;
};

/**
 * Envía una felicitación de cumpleaños
 */
export const sendBirthdayCongratulations = async (
  params: SendCongratulationsParams
): Promise<void> => {
  await api.post("/api/birthday/congratulations", {
    user_id: params.user_id,
    message: params.message,
    ...(params.image_id && { image_id: params.image_id }),
  });
};

