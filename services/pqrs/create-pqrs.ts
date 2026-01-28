import api from "@/lib/axios";

export const uploadFile = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  const binaryData = new Uint8Array(arrayBuffer);

  const response = await api.post(
    "file/upload/node/pqrs/field_file_new",
    binaryData,
    {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `file; filename="${file.name}"`,
        Authorization: "Basic " + btoa("admin:admin"),
      },
    }
  );

  // ✅ Drupal devuelve el ID dentro de fid[0].value
  const fileId = response.data?.fid?.[0]?.value;

  if (!fileId) {
    throw new Error("No se pudo obtener el ID del archivo subido.");
  }

  return fileId; 
};

export const createPqrs = async (payload: any) => {
  const response = await api.post("api/pqrs/create", payload, {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + btoa("admin:admin"),
    },
  });
  return response.data;
};
