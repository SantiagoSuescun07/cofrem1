import { apiBaseUrl } from "@/constants";
import api from "@/lib/axios";
import { EntertainmentCampaign } from "@/types/games";
import { normalizeImageUrl } from "@/lib/image-url-normalizer";

export const fetchCampaigns = async (): Promise<EntertainmentCampaign[]> => {
  const response = await api.get("/jsonapi/node/entertainment", {
    params: {
      include: "field_main_image,field_game_type,field_badges",
    },
  });

  const data = response.data;

  // Crear un mapa de recursos incluidos para acceso rápido
  const includedById = new Map<string, any>();
  if (data.included) {
    data.included.forEach((included: any) => {
      includedById.set(included.id, included);
    });
  }

  const campaigns: EntertainmentCampaign[] = data.data.map((item: any) => {
    // Resolver field_main_image
    const mainImageData = item.relationships.field_main_image?.data;
    const mainImageIncluded = mainImageData
      ? includedById.get(mainImageData.id)
      : null;
    const fieldMainImage = mainImageIncluded
      ? {
          id: mainImageIncluded.id,
          url: normalizeImageUrl(apiBaseUrl, mainImageIncluded.attributes.uri.url),
          alt: mainImageData.meta.alt || "",
          title: mainImageData.meta.title || "",
          width: mainImageData.meta.width || 0,
          height: mainImageData.meta.height || 0,
        }
      : null;

    // Resolver field_game_type (siempre es un array)
    const gameTypeData = item.relationships.field_game_type?.data;
    const fieldGameType: Array<{
      type: string;
      id: string;
      href: string;
    }> = [];
    
    if (gameTypeData) {
      // Convertir a array si no lo es
      const gameTypes = Array.isArray(gameTypeData) ? gameTypeData : [gameTypeData];
      
      gameTypes.forEach((gameType: any) => {
        if (gameType && gameType.type && gameType.id) {
          // Construir la URL del tipo de juego específico
          // Los paragraphs en Drupal JSON:API usan el formato: /jsonapi/paragraph/{type}/{id}
          const paragraphType = gameType.type.replace('paragraph--', '');
          const gameTypeId = gameType.id;
          const href = `/jsonapi/paragraph/${paragraphType}/${gameTypeId}`;
          
          fieldGameType.push({
            type: gameType.type,
            id: gameType.id,
            href: href,
          });
        }
      });
    }

    // Resolver field_badges
    const badgesData = item.relationships.field_badges?.data;
    const badgesIncluded = badgesData
      ? includedById.get(badgesData.id)
      : null;
    const fieldBadges = badgesIncluded
      ? {
          id: badgesIncluded.id,
          name: badgesIncluded.attributes.name || "",
        }
      : null;

    return {
      id: item.id,
      drupal_internal__nid: item.attributes.drupal_internal__nid,
      title: item.attributes.title,
      body: item.attributes.body?.value || item.attributes.body?.processed || "",
      created: item.attributes.created,
      changed: item.attributes.changed,
      field_date_range: item.attributes.field_date_range || {
        value: "",
        end_value: "",
      },
      field_main_image: fieldMainImage,
      field_game_type: fieldGameType,
      field_badges: fieldBadges,
    };
  });

  return campaigns;
};

