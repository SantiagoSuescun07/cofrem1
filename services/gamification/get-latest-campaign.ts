import { apiBaseUrl } from "@/constants";
import api from "@/lib/axios";

export interface GamificationBanner {
  id: string;
  title: string;
  description: string;
  image: {
    id: string;
    url: string;
    alt: string;
    width: number;
    height: number;
  } | null;
  startDate: string;
  endDate: string;
}

/**
 * Obtiene la campaña activa más reciente de gamificación.
 */
export const fetchLatestGamificationBanner =
  async (): Promise<GamificationBanner | null> => {
    const response = await api.get("/jsonapi/node/entertainment", {
      params: {
        include: "field_main_image",
        sort: "-created", // ordena por más reciente
        "filter[status]": "1", // solo activas
      },
    });

    const data = response.data;
    if (!data?.data?.length) return null;

    const includedById = new Map<string, any>();
    if (data.included) {
      data.included.forEach((inc: any) => includedById.set(inc.id, inc));
    }

    // Tomamos la más reciente
    const item = data.data[0];

    const mainImageData = item.relationships.field_main_image?.data;
    const mainImageIncluded = mainImageData
      ? includedById.get(mainImageData.id)
      : null;
    const fieldMainImage = mainImageIncluded
      ? {
          id: mainImageIncluded.id,
          url: apiBaseUrl + mainImageIncluded.attributes.uri.url,
          alt: mainImageData.meta.alt,
          width: mainImageData.meta.width,
          height: mainImageData.meta.height,
        }
      : null;

    return {
      id: item.id,
      title: item.attributes.title,
      description: item.attributes.body?.value || "",
      image: fieldMainImage,
      startDate: item.attributes.field_date_range?.value,
      endDate: item.attributes.field_date_range?.end_value,
    };
  };
