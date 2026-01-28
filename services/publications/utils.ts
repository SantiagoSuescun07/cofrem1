import { apiBaseUrl } from "@/constants";
import { PublicationContent } from "@/types/publications";
import { normalizeImageUrl } from "@/lib/image-url-normalizer";

type IncludedMap = Map<string, any>;

const mapFileRelationshipArray = (
  items: any[] = [],
  includedById: IncludedMap
) => {
  return items
    .map((relItem) => {
      const included = includedById.get(relItem.id);
      const uri = included?.attributes?.uri?.url;
      if (!included || !uri) return null;

      return {
        id: relItem.id,
        url: normalizeImageUrl(apiBaseUrl, uri),
        alt: relItem.meta?.alt || "",
        title: relItem.meta?.title || "",
        width: relItem.meta?.width || included.attributes?.width || 0,
        height: relItem.meta?.height || included.attributes?.height || 0,
      };
    })
    .filter((img) => img !== null);
};

export const mapParagraphContent = (
  optionsData: any,
  includedById: IncludedMap
): PublicationContent | null => {
  if (!optionsData) return null;

  const optionsIncluded = includedById.get(optionsData.id);
  if (!optionsIncluded) return null;

  const contentType = optionsIncluded.type as PublicationContent["type"];

  switch (contentType) {
    case "paragraph--link": {
      const linkField = optionsIncluded.attributes?.field_link;
      if (!linkField?.uri) break;
      return {
        type: contentType,
        id: optionsIncluded.id,
        field_link: {
          uri: linkField.uri,
          title: linkField.title || "",
        },
      };
    }

    case "paragraph--galeria_publicaciones": {
      // El campo correcto es field_galery (con 'a'), field_gallery_images es solo un fallback
      const galleryData =
        optionsIncluded.relationships?.field_galery?.data ||
        optionsIncluded.relationships?.field_gallery_images?.data ||
        [];

      // Mapear las imágenes de la galería
      const galleryImages = galleryData.length > 0 
        ? mapFileRelationshipArray(galleryData, includedById)
        : [];

      return {
        type: contentType,
        id: optionsIncluded.id,
        field_gallery_images: galleryImages,
      };
    }

    case "paragraph--enriched_text": {
      // El campo puede venir como field_enriched_text o field_body
      const enrichedText = optionsIncluded.attributes?.field_enriched_text?.processed || 
                          optionsIncluded.attributes?.field_enriched_text?.value ||
                          optionsIncluded.attributes?.field_body?.processed || 
                          optionsIncluded.attributes?.field_body?.value ||
                          "";
      return {
        type: contentType,
        id: optionsIncluded.id,
        field_body: enrichedText,
      };
    }

    case "paragraph--game_type_publication": {
      const gameData = optionsIncluded.relationships?.field_game?.data;
      if (!gameData) break;
      const paragraphType = gameData.type.replace("paragraph--", "");
      const gameHref = `/jsonapi/paragraph/${paragraphType}/${gameData.id}`;

      return {
        type: contentType,
        id: optionsIncluded.id,
        field_game: {
          id: gameData.id,
          url: gameHref,
          title: optionsIncluded.attributes?.field_title || "Juego",
          description: optionsIncluded.attributes?.field_description || "",
          gameType: gameData.type,
        },
      };
    }

    case "paragraph--video_from_drive": {
      const videoField = optionsIncluded.attributes?.field_video_from_drive;
      if (!videoField?.uri) break;

      return {
        type: contentType,
        id: optionsIncluded.id,
        field_video_from_drive: {
          uri: videoField.uri,
          title: videoField.title || "",
          options: videoField.options || [],
        },
      };
    }
  }

  return null;
};

export const extractGalleryFromContent = (
  content: PublicationContent | null
) => {
  if (content?.type !== "paragraph--galeria_publicaciones") return [];
  return content.field_gallery_images || [];
};

