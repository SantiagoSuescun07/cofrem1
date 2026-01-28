import api from "@/lib/axios";
import { apiBaseUrl } from "@/constants";
import { fetchTaxonomyTermById } from "@/services/taxonomies";
import { normalizeImageUrl } from "@/lib/image-url-normalizer";

export interface UserProfileResponse {
  uid: { value: number }[];
  name: { value: string }[];
  mail: { value: string }[];
  field_full_name?: { value: string }[];
  field_charge?: { value: string }[];
  field_area_subarea?: { target_id: string | number }[];
  field_gender?: { target_id: string | number }[];
  field_headquarters?: { target_id: string | number }[];
  field_phone?: { value: string }[];
  field_cell_phone?: { value: string }[];
  field_birthdate?: { value: string }[];
  user_picture?: Array<{
    target_id?: number;
    url?: string;
    alt?: string | null;
    title?: string | null;
    width?: number;
    height?: number;
  }>;
  field_badges?: { target_uuid: string }[];
}

async function fetchBadgeById(badgeId: string) {
  const response = await api.get(
    `/jsonapi/taxonomy_term/badges/${badgeId}`,
    { params: { include: "field_image" } }
  );

  const item = response.data.data;
  const included = response.data.included;

  // Crear mapa de included para búsqueda rápida
  const includedById = new Map<string, any>();
  if (included?.length > 0) {
    included.forEach((inc: any) => {
      includedById.set(inc.id, inc);
    });
  }

  // Buscar la imagen - primero en relationships, luego en included directo
  let imageUrl = null;
  
  // Intentar obtener de relationships primero
  const imageRel = item.relationships?.field_image?.data;
  if (imageRel) {
    const img = includedById.get(imageRel.id);
    if (img && img.attributes?.uri?.url) {
      const uriUrl = img.attributes.uri.url;
      if (uriUrl) {
        imageUrl = normalizeImageUrl(apiBaseUrl, uriUrl);
        console.log(`[Badge] URL normalizada para badge ${item.attributes.name}:`, imageUrl);
      }
    }
  }
  
  // Si no se encontró en relationships, buscar directamente en included
  if (!imageUrl && included?.length > 0) {
    const img = included.find((i: any) => i.type === "file--file");
    if (img && img.attributes?.uri?.url) {
      const uriUrl = img.attributes.uri.url;
      if (uriUrl) {
        imageUrl = normalizeImageUrl(apiBaseUrl, uriUrl);
        console.log(`[Badge] URL normalizada (desde included directo) para badge ${item.attributes.name}:`, imageUrl);
      }
    }
  }
  
  if (!imageUrl) {
    console.warn(`[Badge] No se encontró imagen para badge ${item.attributes.name}`, {
      hasRelationships: !!item.relationships,
      hasFieldImage: !!item.relationships?.field_image,
      includedCount: included?.length || 0
    });
  }

  return {
    id: item.id,
    tid: item.attributes.drupal_internal__tid,
    name: item.attributes.name,
    description: item.attributes.description?.value ?? null,
    image: imageUrl,
  };
}

export async function getUserProfile(userId: string) {
  console.log(userId)
  const url = `/user/${userId}?_format=json`;
  const { data } = await api.get<UserProfileResponse>(url);

  const genderTargetId = data.field_gender?.[0]?.target_id;
  const areaTargetId = data.field_area_subarea?.[0]?.target_id;
  const headquartersTargetId = data.field_headquarters?.[0]?.target_id;

  const [gender, area, headquarters] = await Promise.all([
    genderTargetId
      ? fetchTaxonomyTermById("/jsonapi/taxonomy_term/gender", genderTargetId, "tid")
      : null,
    areaTargetId
      ? fetchTaxonomyTermById("/jsonapi/taxonomy_term/directory_area", areaTargetId, "tid")
      : null,
    headquartersTargetId
      ? fetchTaxonomyTermById("/jsonapi/taxonomy_term/headquarters", headquartersTargetId, "tid")
      : null,
  ]);

  const badgeIds = data.field_badges?.map((b) => b.target_uuid) ?? [];

  const badges = await Promise.all(
    badgeIds.map(async (badgeId) => await fetchBadgeById(badgeId))
  );

  return {
    id: data.uid?.[0]?.value ?? null,
    name: data.field_full_name?.[0]?.value ?? data.name?.[0]?.value ?? "",
    email: data.mail?.[0]?.value ?? "",
    position: data.field_charge?.[0]?.value ?? "",
    area: area?.name ?? "",
    areaId: area?.id ?? null,
    location: headquarters?.name ?? "",
    locationId: headquarters?.id ?? null,
    phone: data.field_phone?.[0]?.value ?? "",
    mobile: data.field_cell_phone?.[0]?.value ?? "",
    birthdate: data.field_birthdate?.[0]?.value ?? "",
    picture: data.user_picture?.[0]?.url 
      ? (() => {
          const pictureUrl = data.user_picture[0].url;
          // Si ya es una URL absoluta de backoffice, normalizarla
          if (pictureUrl.startsWith("http://") || pictureUrl.startsWith("https://")) {
            if (pictureUrl.includes("backoffice.cofrem.com.co")) {
              // Extraer el path de la URL absoluta
              try {
                const urlObj = new URL(pictureUrl);
                return normalizeImageUrl(apiBaseUrl, urlObj.pathname);
              } catch {
                return pictureUrl;
              }
            }
            return pictureUrl;
          }
          // Si es relativa, normalizarla
          return normalizeImageUrl(apiBaseUrl, pictureUrl);
        })()
      : "",
    genderId: String(gender?.tid) ?? null,
    genderName: gender?.name ?? "Sin especificar",
    badges: badges,
  };
}
