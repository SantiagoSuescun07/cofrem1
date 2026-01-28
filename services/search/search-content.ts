import { apiBaseUrl } from "@/constants";
import api from "@/lib/axios";

export interface SearchResult {
  id: string;
  type: "news" | "publication" | "newsletter" | "directory" | "magazine";
  title: string;
  description?: string;
  url: string;
  image?: {
    url: string;
    alt: string;
  };
  created?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
}

/**
 * Busca contenido en múltiples tipos de entidades de Drupal
 */
export const searchContent = async (query: string): Promise<SearchResponse> => {
  if (!query || query.trim().length < 2) {
    return { results: [], total: 0 };
  }

  const searchTerm = query.trim();
  const results: SearchResult[] = [];

  try {
    // Buscar en noticias
    try {
      const newsResponse = await api.get("/jsonapi/node/news", {
        params: {
          "filter[title][value]": searchTerm,
          "filter[title][operator]": "CONTAINS",
          include: "field_main_image",
          "page[limit]": 5,
        },
      });

      if (newsResponse.data?.data) {
        const includedById = new Map<string, any>();
        if (newsResponse.data.included) {
          newsResponse.data.included.forEach((inc: any) => {
            includedById.set(inc.id, inc);
          });
        }

        newsResponse.data.data.forEach((item: any) => {
          const mainImageData = Array.isArray(item.relationships?.field_main_image?.data)
            ? item.relationships.field_main_image.data[0]
            : item.relationships?.field_main_image?.data;
          const mainImageIncluded = mainImageData?.id
            ? includedById.get(mainImageData.id)
            : null;

          results.push({
            id: item.id,
            type: "news",
            title: item.attributes.title,
            description: item.attributes.body?.value
              ? item.attributes.body.value.replace(/<[^>]*>/g, "").substring(0, 150)
              : undefined,
            url: `/noticias/${item.attributes.drupal_internal__nid}`,
            image: mainImageIncluded?.attributes?.uri?.url
              ? {
                  url: apiBaseUrl + mainImageIncluded.attributes.uri.url,
                  alt: mainImageData?.meta?.alt || item.attributes.title,
                }
              : undefined,
            created: item.attributes.created,
          });
        });
      }
    } catch (error) {
      console.error("Error buscando noticias:", error);
    }

    // Buscar en publicaciones
    try {
      const publicationsResponse = await api.get("/jsonapi/node/publication", {
        params: {
          "filter[title][value]": searchTerm,
          "filter[title][operator]": "CONTAINS",
          include: "field_image",
          "page[limit]": 5,
        },
      });

      if (publicationsResponse.data?.data) {
        const includedById = new Map<string, any>();
        if (publicationsResponse.data.included) {
          publicationsResponse.data.included.forEach((inc: any) => {
            includedById.set(inc.id, inc);
          });
        }

        publicationsResponse.data.data.forEach((item: any) => {
          const imageData = item.relationships?.field_image?.data;
          const imageIncluded = imageData
            ? includedById.get(imageData.id)
            : null;

          results.push({
            id: item.id,
            type: "publication",
            title: item.attributes.title,
            description: item.attributes.field_description?.value
              ? item.attributes.field_description.value
                  .replace(/<[^>]*>/g, "")
                  .substring(0, 150)
              : undefined,
            url: `/publications/${item.id}`,
            image: imageIncluded?.attributes?.uri?.url
              ? {
                  url: apiBaseUrl + imageIncluded.attributes.uri.url,
                  alt: imageData.meta?.alt || item.attributes.title,
                }
              : undefined,
            created: item.attributes.created,
          });
        });
      }
    } catch (error) {
      console.error("Error buscando publicaciones:", error);
    }

    // Buscar en newsletters
    try {
      const newslettersResponse = await api.get("/jsonapi/node/report", {
        params: {
          "filter[title][value]": searchTerm,
          "filter[title][operator]": "CONTAINS",
          include: "field_main_image",
          "page[limit]": 5,
        },
      });

      if (newslettersResponse.data?.data) {
        const includedById = new Map<string, any>();
        if (newslettersResponse.data.included) {
          newslettersResponse.data.included.forEach((inc: any) => {
            includedById.set(inc.id, inc);
          });
        }

        newslettersResponse.data.data.forEach((item: any) => {
          const mainImageData = Array.isArray(item.relationships?.field_main_image?.data)
            ? item.relationships.field_main_image.data[0]
            : item.relationships?.field_main_image?.data;
          const mainImageIncluded = mainImageData?.id
            ? includedById.get(mainImageData.id)
            : null;

          results.push({
            id: item.id,
            type: "newsletter",
            title: item.attributes.title,
            description: item.attributes.field_description?.value
              ? item.attributes.field_description.value
                  .replace(/<[^>]*>/g, "")
                  .substring(0, 150)
              : undefined,
            url: `/newsletters/${item.id}`,
            image: mainImageIncluded?.attributes?.uri?.url
              ? {
                  url: apiBaseUrl + mainImageIncluded.attributes.uri.url,
                  alt: mainImageData?.meta?.alt || item.attributes.title,
                }
              : undefined,
            created: item.attributes.created,
          });
        });
      }
    } catch (error) {
      console.error("Error buscando newsletters:", error);
    }

    // Buscar en directorio (por nombre)
    try {
      const directoryResponse = await api.get("/jsonapi/node/directory", {
        params: {
          "filter[title][value]": searchTerm,
          "filter[title][operator]": "CONTAINS",
          include: "field_picture",
          "page[limit]": 5,
        },
      });

      if (directoryResponse.data?.data) {
        const includedById = new Map<string, any>();
        if (directoryResponse.data.included) {
          directoryResponse.data.included.forEach((inc: any) => {
            includedById.set(inc.id, inc);
          });
        }

        directoryResponse.data.data.forEach((item: any) => {
          const pictureData = Array.isArray(item.relationships?.field_picture?.data)
            ? item.relationships.field_picture.data[0]
            : item.relationships?.field_picture?.data;
          const pictureIncluded = pictureData?.id
            ? includedById.get(pictureData.id)
            : null;

          results.push({
            id: item.id,
            type: "directory",
            title: item.attributes.title,
            description: item.attributes.field_position?.value || undefined,
            url: `/directory`,
            image: pictureIncluded?.attributes?.uri?.url
              ? {
                  url: apiBaseUrl + pictureIncluded.attributes.uri.url,
                  alt: item.attributes.title,
                }
              : undefined,
          });
        });
      }
    } catch (error) {
      console.error("Error buscando directorio:", error);
    }

    // Buscar en Revista Enlace
    try {
      const magazinesResponse = await api.get("/jsonapi/node/magazine_link", {
        params: {
          "filter[title][value]": searchTerm,
          "filter[title][operator]": "CONTAINS",
          "filter[status]": "1",
          "page[limit]": 5,
        },
      });

      if (magazinesResponse.data?.data) {
        // Para cada revista, obtener la imagen si existe
        const magazinesWithImages = await Promise.all(
          magazinesResponse.data.data.map(async (item: any) => {
            const imageHref = item.relationships?.field_image?.links?.related?.href;
            let imageUrl = "";
            let imageAlt = item.attributes.title;

            if (imageHref) {
              try {
                const imgResponse = await api.get(imageHref);
                const fileData = imgResponse.data?.data;
                if (fileData?.attributes?.uri?.url) {
                  imageUrl = apiBaseUrl + fileData.attributes.uri.url;
                }
              } catch (err) {
                console.error("Error cargando imagen de revista:", err);
              }
            }

            return {
              id: item.id,
              type: "magazine" as const,
              title: item.attributes.title,
              description: item.attributes.field_edition_number
                ? `Edición ${item.attributes.field_edition_number}`
                : undefined,
              url: `/revista`,
              image: imageUrl
                ? {
                    url: imageUrl,
                    alt: imageAlt,
                  }
                : undefined,
              created: item.attributes.created,
            };
          })
        );

        results.push(...magazinesWithImages);
      }
    } catch (error) {
      console.error("Error buscando revistas:", error);
    }
  } catch (error) {
    console.error("Error general en búsqueda:", error);
  }

  return {
    results: results.slice(0, 10), // Limitar a 10 resultados totales
    total: results.length,
  };
};

