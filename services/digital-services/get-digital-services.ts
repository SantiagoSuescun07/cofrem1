import api from "@/lib/axios";
import { apiBaseUrl } from "@/constants";
import { normalizeImageUrl } from "@/lib/image-url-normalizer";

export interface DigitalServiceIcon {
  id: string;
  url: string;
  alt: string;
  title: string;
  width: number;
  height: number;
}

export interface DigitalServiceData {
  id: string;
  title: string;
  link: string;
  newTab: boolean;
  icon: DigitalServiceIcon | null;
  nodeId?: string; // ID del nodo si es un enlace interno (entity:node/X)
  isInternal?: boolean; // Indica si es un enlace interno
  weight?: number | null; // Peso para ordenar los servicios
}

export const fetchDigitalServices = async (): Promise<DigitalServiceData[] | null> => {
  try {
    const response = await api.get("/jsonapi/node/digital_services", {
      params: {
        include: "field_icon",
        "filter[status]": "1", // solo los activos
        sort: "-created", // más recientes primero
      },
    });

    console.log("RESPONSE: ", response.data);
    const data = response.data;

    // Verificar si hay datos
    if (!data || !data.data || !Array.isArray(data.data)) {
      console.warn("⚠️ Respuesta de servicios digitales sin datos válidos:", data);
      // Si la respuesta está vacía pero el status es 200, puede ser un problema de autenticación
      if (data?.errors || response.status === 401 || response.status === 403) {
        throw new Error("No autorizado para obtener servicios digitales");
      }
      return [];
    }
    
    // Si el array está vacío pero la respuesta fue exitosa, verificar el meta count
    if (Array.isArray(data.data) && data.data.length === 0 && data.meta?.count === 0) {
      console.log("ℹ️ No hay servicios digitales activos disponibles");
      return [];
    }

    // Crear mapa de archivos incluidos (si los hay)
    const includedById = new Map<string, any>();
    if (data.included) {
      data.included.forEach((included: any) => {
        includedById.set(included.id, included);
      });
    }

    // Mapear los servicios digitales
    const services: DigitalServiceData[] = data.data.map((item: any) => {
      const { id, attributes, relationships } = item;

      console.log(`[DigitalServices] Procesando servicio: ${attributes.title}`);
      console.log(`[DigitalServices] Attributes:`, JSON.stringify(attributes, null, 2));
      console.log(`[DigitalServices] Relationships:`, JSON.stringify(relationships, null, 2));

      // Obtener relación del ícono
      const iconRel = relationships?.field_icon?.data;
      let icon: DigitalServiceIcon | null = null;

      if (iconRel) {
        const includedIcon = includedById.get(iconRel.id);
        if (includedIcon) {
          const attrs = includedIcon.attributes;
          const iconUrl = normalizeImageUrl(apiBaseUrl, attrs.uri.url || "");
          
          icon = {
            id: includedIcon.id,
            url: iconUrl,
            alt: iconRel.meta?.alt || "",
            title: iconRel.meta?.title || "",
            width: iconRel.meta?.width || 0,
            height: iconRel.meta?.height || 0,
          };
        }
      }

      // Procesar el link: detectar si es entity:node/X para enlaces internos
      // El campo field_any_link puede venir en attributes directamente
      let linkUri = attributes.field_any_link?.uri || 
                    attributes.field_any_link || 
                    "";

      // Si no está en attributes, verificar si está en relationships
      if (!linkUri && relationships?.field_any_link) {
        console.log(`[DigitalServices] field_any_link encontrado en relationships:`, relationships.field_any_link);
        // Si es una relación, intentar obtener el URI del included
        const linkRel = relationships.field_any_link.data;
        if (linkRel) {
          const includedLink = includedById.get(linkRel.id);
          if (includedLink) {
            linkUri = includedLink.attributes?.uri || includedLink.attributes?.value || "";
          }
        }
      }

      let link = linkUri;
      let nodeId: string | undefined;
      let isInternal = false;

      console.log(`[DigitalServices] linkUri extraído: "${linkUri}"`);

      // Detectar si es un enlace interno (entity:node/X)
      if (link && typeof link === "string" && link.trim().startsWith("entity:node/")) {
        // Extraer el ID del nodo (ej: "entity:node/8" -> "8")
        nodeId = link.trim().replace("entity:node/", "").trim();
        if (nodeId) {
          isInternal = true;
          // Para enlaces internos, el link será la ruta de Next.js
          link = `/digital-services/${nodeId}`;
          console.log(`[DigitalServices] ✅ Servicio "${attributes.title}" es INTERNO - nodeId: ${nodeId}, ruta: ${link}`);
        }
      } else if (link) {
        console.log(`[DigitalServices] ⚠️ Servicio "${attributes.title}" es EXTERNO - link: ${link}`);
      } else {
        console.log(`[DigitalServices] ⚠️ Servicio "${attributes.title}" NO TIENE LINK`);
      }

      return {
        id,
        title: attributes.title,
        link,
        newTab: attributes.field_new_tab || false,
        icon,
        nodeId,
        isInternal,
        weight: attributes.field_weight ?? null,
      };
    });

    // Ordenar servicios por field_weight
    // Los servicios con weight null o undefined van al final
    const sortedServices = services.sort((a, b) => {
      const weightA = a.weight ?? 9999; // Los null van al final
      const weightB = b.weight ?? 9999;
      return weightA - weightB;
    });

    return sortedServices;
  } catch (error) {
    console.error("Error fetching digital services:", error);
    return null;
  }
};
