import { apiBaseUrl } from "@/constants";
import api from "@/lib/axios";
import { Publication } from "@/types/publications";
import {
  extractGalleryFromContent,
  mapParagraphContent,
} from "./utils";
import { normalizeImageUrl } from "@/lib/image-url-normalizer";

export const fetchSinglePublication = async (
  id: string
): Promise<Publication> => {
  try {
    // field_gallery no existe en publication, las galerías vienen en field_options_in_publication
    // El campo correcto dentro de paragraph--galeria_publicaciones es field_galery (con 'a')
    const response = await api.get(`/jsonapi/node/publication/${id}`, {
      params: {
        include: "field_image,field_news_category,field_options_in_publication,field_options_in_publication.field_galery",
      },
    });

    const item = response.data.data;
    const includedById = new Map<string, any>();
    if (response.data.included) {
      response.data.included.forEach((included: any) => {
        includedById.set(included.id, included);
      });
    }

  // field_gallery no existe en publication, se obtiene de field_options_in_publication
  let fieldGallery: any[] = [];

  // field_image
  const mainImageData = item.relationships.field_image?.data;
  const mainImageIncluded = mainImageData
    ? includedById.get(mainImageData.id)
    : null;
  const fieldImage = mainImageIncluded?.attributes?.uri?.url
    ? {
        id: mainImageIncluded.id,
        url: normalizeImageUrl(apiBaseUrl, mainImageIncluded.attributes.uri.url),
        alt: mainImageData.meta?.alt || "",
        title: mainImageData.meta?.title || "",
        width: mainImageData.meta?.width || 0,
        height: mainImageData.meta?.height || 0,
      }
    : null;

  // field_news_category
  const categoryData = item.relationships.field_news_category?.data || [];
  const fieldNewsCategory = categoryData
    .map((catItem: any) => {
      const catIncluded = includedById.get(catItem.id);
      if (!catIncluded?.attributes?.name) return null;
      return {
        id: catItem.id,
        name: catIncluded.attributes.name,
      };
    })
    .filter((cat: any) => cat !== null);

  // field_options_in_publication (puede ser array o objeto único)
  const optionsData = item.relationships.field_options_in_publication?.data;
  let fieldOptionsInPublication = null;
  
  if (optionsData) {
    // Si es un array, tomar el primero; si es objeto único, usarlo directamente
    const dataToMap = Array.isArray(optionsData) ? optionsData[0] : optionsData;
    fieldOptionsInPublication = mapParagraphContent(dataToMap, includedById);
  }
  const galleryFromOptions = extractGalleryFromContent(
    fieldOptionsInPublication
  );

  if (fieldGallery.length === 0 && galleryFromOptions.length > 0) {
    fieldGallery = galleryFromOptions;
  }

  return {
    id: item.id,
    drupal_internal__nid: item.attributes.drupal_internal__nid,
    title: item.attributes.title,
    description: item.attributes.body || "",
    field_description: item.attributes.field_description || null,
    created: item.attributes.created,
    field_any_link: item.attributes.field_any_link?.uri || null,
    field_video_link: item.attributes.field_video_link?.uri || null,
    field_gallery: fieldGallery,
    field_image: fieldImage ,
    field_news_category: fieldNewsCategory,
    field_options_in_publication: fieldOptionsInPublication,
  };
  } catch (error: any) {
    console.error("Error fetching single publication:", error);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response statusText:", error.response.statusText);
      console.error("Response data:", JSON.stringify(error.response.data, null, 2));
      console.error("Request URL:", error.config?.url);
      console.error("Request params:", error.config?.params);
    }
    if (error.request) {
      console.error("Request details:", error.request);
    }
    throw error;
  }
};
