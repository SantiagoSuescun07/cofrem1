// services/taxonomies/index.ts
import api from "@/lib/axios";
import type { TaxonomyApiResponse, TaxonomyTerm } from "@/types/global";
import type { AxiosResponse } from "axios";

export const fetchTaxonomyTerms = async (
  endpoint: string
): Promise<TaxonomyTerm[]> => {
  try {
    const response: AxiosResponse<TaxonomyApiResponse> = await api.get(
      endpoint
    );

    return response.data.data.map((item) => ({
      id: item.id,
      tid: item.attributes.drupal_internal__tid,
      name: item.attributes.name,
    }));
  } catch (error) {
    console.error(`Error fetching taxonomy terms from ${endpoint}:`, error);
    return [];
  }
};

/**
 * Busca un término específico de taxonomía por su ID (UUID o TID)
 * @param endpoint - Ruta del endpoint de la taxonomía
 * @param targetId - Puede ser UUID (string) o TID (number)
 * @param searchBy - Tipo de búsqueda: 'uuid' o 'tid'
 * @returns El término encontrado o null
 */
export const fetchTaxonomyTermById = async (
  endpoint: string,
  targetId: string | number,
  searchBy: "uuid" | "tid" = "uuid"
): Promise<TaxonomyTerm | null> => {
  try {
    const terms = await fetchTaxonomyTerms(endpoint);

    if (searchBy === "uuid") {
      return terms.find((term) => term.id === targetId) ?? null;
    } else {
      return terms.find((term) => term.tid === Number(targetId)) ?? null;
    }
  } catch (error) {
    console.error(
      `Error fetching taxonomy term by ${searchBy} from ${endpoint}:`,
      error
    );
    return null;
  }
};

/**
 * Busca múltiples términos de taxonomía por sus IDs
 * @param endpoint - Ruta del endpoint de la taxonomía
 * @param targetIds - Array de UUIDs o TIDs
 * @param searchBy - Tipo de búsqueda: 'uuid' o 'tid'
 * @returns Array de términos encontrados
 */
export const fetchTaxonomyTermsByIds = async (
  endpoint: string,
  targetIds: (string | number)[],
  searchBy: "uuid" | "tid" = "uuid"
): Promise<TaxonomyTerm[]> => {
  try {
    const terms = await fetchTaxonomyTerms(endpoint);

    if (searchBy === "uuid") {
      return terms.filter((term) => targetIds.includes(term.id));
    } else {
      return terms.filter((term) =>
        targetIds.map(Number).includes(term.tid!)
      );
    }
  } catch (error) {
    console.error(
      `Error fetching taxonomy terms by ${searchBy} from ${endpoint}:`,
      error
    );
    return [];
  }
};