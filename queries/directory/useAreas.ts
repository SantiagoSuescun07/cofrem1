// hooks/useAreas.ts
import api from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

interface Term {
  id: string;
  name: string;
  parentId: string | null;
}

export function useAreas() {
  return useQuery({
    queryKey: ["areas"],
    queryFn: async () => {
      const { data } = await api.get("/jsonapi/taxonomy_term/directory_area");

      const terms: Term[] = data.data.map((item: any) => ({
        id: String(item.attributes.drupal_internal__tid),
        name: item.attributes.name,
        parentId:
          item.relationships.parent?.data?.[0]?.meta?.drupal_internal__target_id !=
          null
            ? String(
                item.relationships.parent?.data?.[0]?.meta
                  ?.drupal_internal__target_id
              )
            : null,
      }));

      // Estructurar áreas con subáreas
      const areas = terms
        .filter((t) => !t.parentId || t.parentId === "virtual")
        .map((area) => ({
          ...area,
          children: terms.filter((t) => t.parentId === area.id),
        }));

      return areas;
    },
  });
}
