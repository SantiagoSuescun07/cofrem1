import { apiBaseUrl } from "@/constants";
import api from "@/lib/axios";
import { News } from "@/types/news/news";
import { normalizeImageUrl } from "@/lib/image-url-normalizer";

export const fetchSingleNews = async (id: string): Promise<News> => {
  const response = await api.get(`/jsonapi/node/news/${id}`, {
    params: {
      include: "field_file_new,field_gallery,field_main_image,field_segmentation",
    },
  });

  const item = response.data.data;

  const includedById = new Map<string, any>();
  if (response.data.included) {
    response.data.included.forEach((included: any) => {
      includedById.set(included.id, included);
    });
  }

  // field_file_new
  const fileNewData = item.relationships.field_file_new?.data;
  const fileNewIncluded = fileNewData ? includedById.get(fileNewData.id) : null;
  const fieldFileNew = fileNewIncluded
    ? {
        id: fileNewIncluded.id,
        url: normalizeImageUrl(apiBaseUrl, fileNewIncluded.attributes.uri.url),
        display: item.relationships.field_file_new.data.meta.display,
        description: item.relationships.field_file_new.data.meta.description,
        filename: fileNewIncluded.attributes.filename || "",
      }
    : null;

  // field_gallery
  const galleryData = item.relationships.field_gallery?.data || [];
  const fieldGallery = galleryData.map((galItem: any) => {
    const galIncluded = includedById.get(galItem.id);
    return {
      id: galIncluded.id,
      url: normalizeImageUrl(apiBaseUrl, galIncluded.attributes.uri.url),
      alt: galItem.meta.alt,
      title: galItem.meta.title,
      width: galItem.meta.width,
      height: galItem.meta.height,
    };
  });

  // field_main_image
  const mainImageData = item.relationships.field_main_image?.data;
  const mainImageIncluded = mainImageData ? includedById.get(mainImageData.id) : null;
  const fieldMainImage = mainImageIncluded
    ? {
        id: mainImageIncluded.id,
        url: normalizeImageUrl(apiBaseUrl, mainImageIncluded.attributes.uri.url),
        alt: mainImageData.meta.alt,
        title: mainImageData.meta.title,
        width: mainImageData.meta.width,
        height: mainImageData.meta.height,
      }
    : null;

  // field_segmentation
  const segmentationData = item.relationships.field_segmentation?.data || [];
  const fieldSegmentation = segmentationData.map((segItem: any) => {
    const segIncluded = includedById.get(segItem.id);
    return {
      id: segIncluded.id,
      name: segIncluded.attributes.name,
      type: segIncluded.type,
    };
  });

  return {
    id: item.id,
    drupal_internal__nid: item.attributes.drupal_internal__nid,
    title: item.attributes.title,
    body: item.attributes.body.value,
    created: item.attributes.created,
    comments: item.attributes.comment,
    field_file_new: fieldFileNew,
    field_gallery: fieldGallery,
    field_main_image: fieldMainImage,
    field_segmentation: fieldSegmentation,
  };
};