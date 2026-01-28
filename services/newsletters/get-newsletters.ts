import { apiBaseUrl } from "@/constants";
import api from "@/lib/axios";
import { Newsletter } from "@/types/newsletters";
import { normalizeImageUrl } from "@/lib/image-url-normalizer";

export const fetchNewsletters = async (): Promise<Newsletter[]> => {
  const response = await api.get("/jsonapi/node/report", {
    params: {
      include: "field_main_image",
    },
  });

  const data = response.data;
  const includedById = new Map<string, any>();
  if (data.included) {
    data.included.forEach((inc: any) => includedById.set(inc.id, inc));
  }

  return data.data.map((item: any) => {
    // Archivos adjuntos
    const attachmentsData = item.relationships.field_attachments?.data || [];
    const fieldAttachments = attachmentsData
      .map((att: any) => {
        if (!att?.id) return null;
        const attIncluded = includedById.get(att.id);
        if (!attIncluded?.attributes?.uri?.url) return null;
        return {
          id: attIncluded.id,
          url: normalizeImageUrl(apiBaseUrl, attIncluded.attributes.uri.url),
        };
      })
      .filter((att: any) => att !== null);

    // Categoría (taxonomy)
    const categoryData = item.relationships.field_category_report?.data;
    const categoryIncluded = categoryData?.id
      ? includedById.get(categoryData.id)
      : null;
    const fieldCategoryReport = categoryIncluded?.attributes
      ? {
          id: categoryIncluded.id,
          tid: categoryIncluded.attributes.drupal_internal__tid,
          name: categoryIncluded.attributes.name,
        }
      : null;

    // Imagen principal
    const mainImageData = item.relationships.field_main_image?.data;
    const mainImageIncluded = mainImageData?.id
      ? includedById.get(mainImageData.id)
      : null;
    const fieldMainImage =
      mainImageIncluded?.attributes?.uri?.url && mainImageData?.meta
        ? {
            id: mainImageIncluded.id,
            url: normalizeImageUrl(apiBaseUrl, mainImageIncluded.attributes.uri.url),
            alt: mainImageData.meta.alt || "",
            title: mainImageData.meta.title || "",
            width: mainImageData.meta.width || 0,
            height: mainImageData.meta.height || 0,
          }
        : null;

    // PDF
    const pdfData = item.relationships.field_report_pdf?.data;
    const pdfIncluded = pdfData?.id ? includedById.get(pdfData.id) : null;
    const fieldReportPdf = pdfIncluded?.attributes?.uri?.url
      ? {
          id: pdfIncluded.id,
          url: normalizeImageUrl(apiBaseUrl, pdfIncluded.attributes.uri.url),
        }
      : null;

    // Tipo de reporte (taxonomy)
    const typeData = item.relationships.field_type_report?.data;
    const typeIncluded = typeData?.id ? includedById.get(typeData.id) : null;
    const fieldTypeReport = typeIncluded?.attributes
      ? {
          id: typeIncluded.id,
          tid: typeIncluded.attributes.drupal_internal__tid,
          name: typeIncluded.attributes.name,
        }
      : null;

    // Link - extraer el URI del campo field_any_link
    const fieldLink = item.attributes.field_any_link?.uri || null;

    return {
      id: item.id,
      drupal_internal__nid: item.attributes.drupal_internal__nid,
      title: item.attributes.title,
      description: item.attributes.body?.summary ?? null,
      created: item.attributes.created,
      field_attachments: fieldAttachments,
      field_category_report: fieldCategoryReport,
      field_main_image: fieldMainImage,
      field_report_pdf: fieldReportPdf,
      field_type_report: fieldTypeReport,
      field_link: fieldLink,
    };
  });
};
