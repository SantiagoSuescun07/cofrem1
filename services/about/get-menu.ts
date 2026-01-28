import api from "@/lib/axios";

export interface AboutUsMenuItem {
  key: string;
  title: string;
  description: string | null;
  uri: string;
  alias: string | null;
  external: boolean;
  absolute: string;
  relative: string;
  existing: boolean;
  weight: string;
  expanded: boolean;
  enabled: boolean;
  uuid: string | null;
  options: Record<string, any> | [];
}

export interface AboutUsFile {
  target_id: number;
  display: boolean;
  description: string;
  url: string;
}

export interface AboutUsGalleryItem {
  target_id: number;
  alt: string;
  title: string;
  width: number;
  height: number;
  url: string;
}

export interface AboutUsNode {
  nid: number;
  title: string;
  body: string;
  field_file?: AboutUsFile[];
  field_gallery?: AboutUsGalleryItem[];
  field_main_image_optional?: AboutUsGalleryItem[];
}

// Menú lateral de “Nosotros”
export const fetchAboutUsMenu = async (): Promise<AboutUsMenuItem[]> => {
  const { data } = await api.get("/api/menu_items/about-us");
  return data;
};

export const fetchAboutUsNode = async (id: string): Promise<AboutUsNode> => {
  const { data } = await api.get(`/node/${id}?_format=json`, {
    auth: {
      username: process.env.NEXT_PUBLIC_BASIC_AUTH_USER || "admin",
      password: process.env.NEXT_PUBLIC_BASIC_AUTH_PASS || "admin",
    },
  });

  return {
    nid: data.nid?.[0]?.value,
    title: data.title?.[0]?.value,
    body: data.body?.[0]?.processed ?? "",

    field_file: data.field_file?.map((f: any) => ({
      target_id: f.target_id,
      display: f.display,
      description: f.description,
      url: f.url,
    })),

    field_gallery: data.field_gallery?.map((g: any) => ({
      target_id: g.target_id,
      alt: g.alt,
      title: g.title,
      width: g.width,
      height: g.height,
      url: g.url,
    })),

    // 🔹 Agregamos el campo principal
    field_main_image_optional: data.field_main_image_optional?.map(
      (img: any) => ({
        target_id: img.target_id,
        alt: img.alt,
        title: img.title,
        width: img.width,
        height: img.height,
        url: img.url,
      })
    ),
  };
};
