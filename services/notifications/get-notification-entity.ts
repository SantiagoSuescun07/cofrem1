import { apiBaseUrl } from "@/constants";
import api from "@/lib/axios";
import { Publication } from "@/types/publications";
import { CalendarEvent } from "@/types";

export interface NotificationEntity {
  type: "publication" | "calendar" | "unknown";
  data: Publication | CalendarEvent | null;
}

/**
 * Obtiene los datos de la entidad relacionada con una notificación
 * basándose en el link de la notificación
 */
export const fetchNotificationEntity = async (
  notificationLink: string,
  entityBundle?: string
): Promise<NotificationEntity> => {
  try {
    // Extraer la URL de la entidad del link
    let apiUrl = "";
    let bundleType = entityBundle || "publication"; // Default a publication
    
    if (!notificationLink || notificationLink.trim() === "") {
      console.warn("Notification link is empty or invalid");
      return { type: "unknown", data: null };
    }

    // Normalizar el link (remover la base URL si está presente)
    let normalizedLink = notificationLink;
    if (normalizedLink.includes("backoffice.cofrem.com.co")) {
      const match = normalizedLink.match(/\/jsonapi\/.*/);
      if (match) {
        normalizedLink = match[0];
      }
    }

    if (normalizedLink.startsWith("/jsonapi/")) {
      // Si el link ya es un endpoint de JSON:API, usarlo directamente
      // Remover query params si existen
      apiUrl = normalizedLink.split("?")[0];
      // Extraer el tipo de bundle del URL
      const urlParts = apiUrl.split("/").filter((part) => part && part !== "jsonapi");
      const nodeIndex = urlParts.indexOf("node");
      if (nodeIndex !== -1 && nodeIndex + 1 < urlParts.length) {
        bundleType = urlParts[nodeIndex + 1]; // El bundle después de "node"
      }
    } else if (normalizedLink.startsWith("/node/")) {
      // Si es un link /node/{id}, necesitamos convertirlo a formato JSON:API
      const nodeId = normalizedLink.replace("/node/", "").split("?")[0];
      // Usar el entityBundle si está disponible, si no, intentar con publication
      bundleType = entityBundle || "publication";
      apiUrl = `/jsonapi/node/${bundleType}/${nodeId}`;
    } else {
      console.warn("Notification link format not recognized:", notificationLink);
      return { type: "unknown", data: null };
    }

    if (!apiUrl || apiUrl.trim() === "") {
      console.warn("Could not construct API URL from notification link:", notificationLink);
      return { type: "unknown", data: null };
    }

    // Determinar qué incluir según el tipo
    const includeParams = bundleType === "publication" 
      ? "field_gallery,field_image"
      : bundleType === "calendar"
      ? "field_image,field_event_type,field_dependencies"
      : "field_image";

    console.log("Fetching notification entity from:", apiUrl, "with include:", includeParams);

    // Hacer la petición con include
    let response;
    try {
      response = await api.get(apiUrl, {
        params: {
          include: includeParams,
        },
      });
    } catch (includeError: any) {
      // Si falla con include, intentar sin include
      if (includeError.response?.status === 400) {
        console.warn("Request with include failed, retrying without include");
        response = await api.get(apiUrl);
      } else {
        throw includeError; // Re-lanzar si es otro tipo de error
      }
    }

    const item = response.data.data;
    const includedById = new Map<string, any>();
    if (response.data.included) {
      response.data.included.forEach((included: any) => {
        includedById.set(included.id, included);
      });
    }

    // Determinar el tipo de entidad
    if (item.type === "node--publication") {
      // Procesar como publicación
      const galleryData = item.relationships.field_gallery?.data || [];
      const fieldGallery = galleryData.map((galItem: any) => {
        const galIncluded = includedById.get(galItem.id);
        return {
          id: galIncluded.id,
          url: apiBaseUrl + galIncluded.attributes.uri.url,
          alt: galItem.meta.alt,
          title: galItem.meta.title,
          width: galItem.meta.width,
          height: galItem.meta.height,
        };
      });

      const mainImageData = item.relationships.field_image?.data;
      const mainImageIncluded = mainImageData
        ? includedById.get(mainImageData.id)
        : null;
      const fieldImage = mainImageIncluded
        ? {
            id: mainImageIncluded.id,
            url: apiBaseUrl + mainImageIncluded.attributes.uri.url,
            alt: mainImageData.meta.alt,
            title: mainImageData.meta.title,
            width: mainImageData.meta.width,
            height: mainImageData.meta.height,
          }
        : null;

      // field_news_category
      const categoryData = item.relationships.field_news_category?.data || [];
      const fieldNewsCategory = categoryData.map((catItem: any) => {
        const catIncluded = includedById.get(catItem.id);
        return {
          id: catItem.id,
          name: catIncluded?.attributes?.name || "",
        };
      });

      const publication: Publication = {
        id: item.id,
        drupal_internal__nid: item.attributes.drupal_internal__nid,
        title: item.attributes.title,
        description: item.attributes.body?.processed || "",
        field_description: item.attributes.field_description || null,
        created: item.attributes.created,
        field_any_link: item.attributes.field_any_link?.uri || null,
        field_video_link: item.attributes.field_video_link?.uri || null,
        field_gallery: fieldGallery,
        field_image: fieldImage,
        field_news_category: fieldNewsCategory,
        field_options_in_publication: null, // No incluido en notificaciones para simplificar
      };

      return { type: "publication", data: publication };
    } else if (item.type === "node--calendar") {
      // Procesar como evento de calendario
      const eventTypeId = item.relationships.field_event_type?.data?.id;
      const eventType = eventTypeId ? includedById.get(eventTypeId) : null;

      const dependenciesId = item.relationships.field_dependencies?.data?.id;
      const dependencies = dependenciesId
        ? includedById.get(dependenciesId)
        : null;

      const imageId = item.relationships.field_image?.data?.id;
      const image = imageId ? includedById.get(imageId) : null;

      const calendarEvent: CalendarEvent = {
        id: item.id,
        title: item.attributes.title,
        description: item.attributes.body?.processed || "",
        date: item.attributes.field_date,
        place: item.attributes.field_place,
        mapLink: {
          uri: item.attributes.field_map_link?.uri || "",
          title: item.attributes.field_map_link?.title || "Ver mapa",
        },
        infoButton: {
          uri: item.attributes.field_info_button?.uri || "",
          title: item.attributes.field_info_button?.title || "Más información",
        },
        isNotificationsEnabled:
          item.attributes.field_is_notifications_enabled,
        eventType: {
          id: eventTypeId || "",
          name: eventType?.attributes?.name || "Evento",
        },
        dependencies: {
          id: dependenciesId || "",
          name: dependencies?.attributes?.name || "General",
        },
        image: {
          url: image?.attributes?.uri?.url
            ? `${apiBaseUrl}${image.attributes.uri.url}`
            : "/corporate-event.png",
          alt:
            item.relationships.field_image?.data?.meta?.alt ||
            item.attributes.title,
        },
      };

      return { type: "calendar", data: calendarEvent };
    }

    return { type: "unknown", data: null };
  } catch (error: any) {
    console.error("Error fetching notification entity:", error);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
      console.error("Request URL:", error.config?.url);
      console.error("Request params:", error.config?.params);
    }
    // Retornar un objeto con tipo unknown pero sin lanzar error
    return { type: "unknown", data: null };
  }
};
