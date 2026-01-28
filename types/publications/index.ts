export type PublicationContentType =
  | "paragraph--link"
  | "paragraph--galeria_publicaciones"
  | "paragraph--enriched_text"
  | "paragraph--game_type_publication"
  | "paragraph--video_from_drive";

export interface PublicationContent {
  type: PublicationContentType;
  id: string;
  // Para paragraph--link
  field_link?: {
    uri: string;
    title: string;
  };
  // Para paragraph--galeria_publicaciones
  field_gallery_images?: {
    id: string;
    url: string;
    alt: string;
    title: string;
    width: number;
    height: number;
  }[];
  // Para paragraph--enriched_text
  field_body?: string;
  // Para paragraph--game_type_publication
  field_game?: {
    id: string;
    url: string;
    title: string;
    description?: string;
    gameType: string; // Tipo de juego: paragraph--wordsearch_game, paragraph--puzzle_game, etc.
  };
  // Para paragraph--video_from_drive
  field_video_from_drive?: {
    uri: string;
    title?: string;
    options?: unknown[];
  };
}

export interface Publication {
  id: string;
  drupal_internal__nid: number;
  title: string;
  description: string;
  field_description: string | null;
  created: string;
  field_any_link: string | null;
  field_video_link: string | null;
  field_gallery: {
    id: string;
    url: string;
    alt: string;
    title: string;
    width: number;
    height: number;
  }[];
  field_image: {
    id: string;
    url: string;
    alt: string;
    title: string;
    width: number;
    height: number;
  } | null;
  field_news_category: {
    id: string;
    name: string;
  }[];
  field_options_in_publication: PublicationContent | null;
}