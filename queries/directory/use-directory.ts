// queries/directory/use-directory.ts
import api from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

export function useDirectoryByArea(areaId: number) {
  return useQuery({
    queryKey: ["directory", areaId],
    enabled: !!areaId,
    queryFn: async () => {
      // 1️⃣ Consultar el directorio filtrado por área/subárea
      const { data } = await api.get(
        `/jsonapi/node/directory?filter[field_directory_area.meta.drupal_internal__target_id]=${areaId}&include=field_picture`
      );

      // 2️⃣ Mapa de imágenes incluidas
      const includedFiles =
        data.included?.reduce((acc: any, file: any) => {
          if (file.type === "file--file") {
            acc[file.id] = file.attributes.uri?.url;
          }
          return acc;
        }, {}) || {};

      // 3️⃣ Para cada persona, obtener la taxonomía del directory_area
      const people = await Promise.all(
        data.data.map(async (item: any) => {
          const imageId = item.relationships?.field_picture?.data?.id;
          const imageUrl = imageId
            ? `https://backoffice.cofrem.com.co${includedFiles[imageId]}`
            : "/default.png";

          // Relación con directory_area
          const areaRelation =
            item.relationships?.field_directory_area?.data ?? null;
          let areaName = null;
          let parentArea = null;

          if (areaRelation?.id) {
            try {
              // Llamar al endpoint de taxonomía
              const { data: areaData } = await api.get(
                `/jsonapi/taxonomy_term/directory_area/${areaRelation.id}`
              );

              areaName = areaData.data?.attributes?.name ?? null;
              const parentRel = areaData.data?.relationships?.parent?.data?.[0];
              if (parentRel?.id) {
                // Si tiene padre, obtener también su nombre
                const { data: parentData } = await api.get(
                  `/jsonapi/taxonomy_term/directory_area/${parentRel.id}`
                );
                parentArea = parentData.data?.attributes?.name ?? null;
              }
            } catch (err) {
              console.warn("Error fetching area/subarea:", err);
            }
          }

          return {
            id: item.id,
            name: item.attributes.title,
            position: item.attributes.field_charge,
            email: item.attributes.field_mail,
            phone: item.attributes.field_phone,
            imageUrl,
            area: areaName,
            parentArea,
          };
        })
      );

      return people;
    },
  });
}
