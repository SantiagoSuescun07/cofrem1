import { apiBaseUrl } from "@/constants";
import api from "@/lib/axios";

export interface DigitalServiceNode {
  nid: number;
  uuid: string;
  vid: number;
  langcode: string;
  type: {
    target_id: string;
    target_type: string;
    target_uuid: string;
  };
  title: string;
  created: string;
  changed: string;
  status: boolean;
  body?: string; // Contenido HTML procesado
  field_icon?: {
    target_id: number;
    alt: string;
    title: string;
    width: number;
    height: number;
    target_type: string;
    target_uuid: string;
    url: string;
  };
  field_any_link?: {
    uri: string;
    title: string;
    options: any[];
  };
  field_new_tab?: boolean;
  field_weight?: any[];
  field_file?: {
    target_id: number;
    display: boolean;
    description: string;
    target_type: string;
    target_uuid: string;
    url: string;
    filename?: string;
  };
  field_gallery?: Array<{
    target_id: number;
    alt: string;
    title: string;
    width: number;
    height: number;
    target_type: string;
    target_uuid: string;
    url: string;
  }>;
  field_main_image_optional?: {
    target_id: number;
    alt: string;
    title: string;
    width: number;
    height: number;
    target_type: string;
    target_uuid: string;
    url: string;
  };
  [key: string]: any; // Para otros campos que puedan venir
}

export const fetchDigitalServiceNode = async (nodeId: string): Promise<DigitalServiceNode> => {
  console.log(`Fetching digital service node with ID: ${nodeId}`);
  
  const response = await api.get(`/node/${nodeId}`, {
    params: {
      _format: "json",
    },
  });

  console.log(`Response for node ${nodeId}:`, response.data);
  const data = response.data;

  // Procesar el formato de respuesta del BAC
  const node: DigitalServiceNode = {
    nid: data.nid?.[0]?.value || 0,
    uuid: data.uuid?.[0]?.value || "",
    vid: data.vid?.[0]?.value || 0,
    langcode: data.langcode?.[0]?.value || "es",
    type: {
      target_id: data.type?.[0]?.target_id || "",
      target_type: data.type?.[0]?.target_type || "",
      target_uuid: data.type?.[0]?.target_uuid || "",
    },
    title: data.title?.[0]?.value || "",
    created: data.created?.[0]?.value || "",
    changed: data.changed?.[0]?.value || "",
    status: data.status?.[0]?.value || false,
  };

  // Procesar field_icon si existe
  if (data.field_icon?.[0]) {
    const iconData = data.field_icon[0];
    node.field_icon = {
      target_id: iconData.target_id || 0,
      alt: iconData.alt || "",
      title: iconData.title || "",
      width: iconData.width || 0,
      height: iconData.height || 0,
      target_type: iconData.target_type || "",
      target_uuid: iconData.target_uuid || "",
      url: iconData.url || "",
    };
  }

  // Procesar field_any_link si existe
  if (data.field_any_link?.[0]) {
    node.field_any_link = {
      uri: data.field_any_link[0].uri || "",
      title: data.field_any_link[0].title || "",
      options: data.field_any_link[0].options || [],
    };
  }

  // Procesar field_new_tab si existe
  if (data.field_new_tab?.[0]) {
    node.field_new_tab = data.field_new_tab[0].value || false;
  }

  // Procesar field_weight si existe
  if (data.field_weight) {
    node.field_weight = data.field_weight;
  }

  // Procesar body si existe
  if (data.body?.[0]) {
    node.body = data.body[0].processed || data.body[0].value || "";
  }

  // Procesar field_file si existe
  if (data.field_file?.[0]) {
    const fileData = data.field_file[0];
    node.field_file = {
      target_id: fileData.target_id || 0,
      display: fileData.display !== undefined ? fileData.display : true,
      description: fileData.description || "",
      target_type: fileData.target_type || "",
      target_uuid: fileData.target_uuid || "",
      url: fileData.url || "",
      filename: fileData.url ? fileData.url.split("/").pop() || "" : "",
    };
  }

  // Procesar field_gallery si existe
  if (data.field_gallery && Array.isArray(data.field_gallery) && data.field_gallery.length > 0) {
    node.field_gallery = data.field_gallery.map((galleryItem: any) => ({
      target_id: galleryItem.target_id || 0,
      alt: galleryItem.alt || "",
      title: galleryItem.title || "",
      width: galleryItem.width || 0,
      height: galleryItem.height || 0,
      target_type: galleryItem.target_type || "",
      target_uuid: galleryItem.target_uuid || "",
      url: galleryItem.url || "",
    }));
  }

  // Procesar field_main_image_optional si existe
  if (data.field_main_image_optional?.[0]) {
    const mainImageData = data.field_main_image_optional[0];
    node.field_main_image_optional = {
      target_id: mainImageData.target_id || 0,
      alt: mainImageData.alt || "",
      title: mainImageData.title || "",
      width: mainImageData.width || 0,
      height: mainImageData.height || 0,
      target_type: mainImageData.target_type || "",
      target_uuid: mainImageData.target_uuid || "",
      url: mainImageData.url || "",
    };
  }

  return node;
};

