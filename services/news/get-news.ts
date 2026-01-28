import { apiBaseUrl } from "@/constants";
import api from "@/lib/axios";
import { News } from "@/types/news/news";
import { normalizeImageUrl } from "@/lib/image-url-normalizer";

// Fetch function for all news items (client-side pagination)
export const fetchNews = async (): Promise<{
  items: News[];
  totalPages: number;
}> => {
  const response = await api.get("/jsonapi/node/news", {
    params: {
      include: "field_file_new,field_gallery,field_main_image,field_segmentation",
    },
  });

  const data = response.data;

  // Verificar si hay datos
  if (!data || !data.data || !Array.isArray(data.data)) {
    console.warn("⚠️ Respuesta de noticias sin datos válidos:", data);
    // Si la respuesta está vacía pero el status es 200, puede ser un problema de autenticación
    if (data?.errors || response.status === 401 || response.status === 403) {
      throw new Error("No autorizado para obtener noticias");
    }
    return {
      items: [],
      totalPages: 0,
    };
  }
  
  // Si el array está vacío pero la respuesta fue exitosa, verificar el meta count
  if (Array.isArray(data.data) && data.data.length === 0 && data.meta?.count === 0) {
    console.log("ℹ️ No hay noticias disponibles");
    return {
      items: [],
      totalPages: 0,
    };
  }

  const includedById = new Map<string, any>();
  if (data.included) {
    data.included.forEach((included: any) => {
      includedById.set(included.id, included);
    });
  }

  const newsItems = data.data.map((item: any) => {
    // Resolve field_file_new (single file)
    const fileNewData = item.relationships.field_file_new?.data;
    const fileNewIncluded = fileNewData
      ? includedById.get(fileNewData.id)
      : null;
    const fieldFileNew = fileNewIncluded
      ? {
          id: fileNewIncluded.id,
          url: normalizeImageUrl(apiBaseUrl, fileNewIncluded.attributes.uri.url),
          display: item.relationships.field_file_new.data.meta.display,
          description: item.relationships.field_file_new.data.meta.description,
          filename: fileNewIncluded.attributes.filename || "",
        }
      : null;

    // Resolve field_gallery (array of images/files)
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

    // Resolve field_main_image (single image/file)
    const mainImageData = item.relationships.field_main_image?.data;
    const mainImageIncluded = mainImageData
      ? includedById.get(mainImageData.id)
      : null;
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

    // Resolve field_segmentation (array of taxonomy terms)
    const segmentationData = item.relationships.field_segmentation?.data || [];
    const fieldSegmentation = segmentationData.map((segItem: any) => {
      const segIncluded = includedById.get(segItem.id);
      return {
        id: segIncluded.id,
        name: segIncluded.attributes.name, // taxonomy attribute
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
  });

  // Ordenar por fecha de creación descendente (más reciente primero)
  const sortedNewsItems = newsItems.sort((a: News, b: News) => {
    const dateA = new Date(a.created).getTime();
    const dateB = new Date(b.created).getTime();
    return dateB - dateA; // Orden descendente (más reciente primero)
  });

  // Client-side pagination (10 items per page)
  const totalItems = sortedNewsItems.length;
  const limit = 10;
  const totalPages = Math.ceil(totalItems / limit);

  console.log("Total Items:", totalItems, "Total Pages:", totalPages);

  return {
    items: sortedNewsItems,
    totalPages,
  };
};
