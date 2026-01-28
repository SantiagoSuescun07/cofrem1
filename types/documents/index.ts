export interface DocumentFile {
  id: string;
  filename: string;
  url: string;
  filemime: string;
  filesize: number;
  description?: string;
  field_is_confidential?: boolean; // Si es true, el archivo es privado
  field_allow_download?: boolean; // Si es false, no se permite descarga
}

export interface DocumentIcon {
  id: string;
  url: string;
  alt: string;
  title: string;
  width: number;
  height: number;
}

export interface ModuleCategory {
  id: string;
  name: string;
  drupal_internal__tid: number;
}

export interface DocumentModule {
  id: string;
  name?: string;
  drupal_internal__tid: number;
}

export interface Document {
  id: string;
  drupal_internal__nid: number;
  title: string;
  created: string;
  changed: string;
  field_file: DocumentFile[];
  field_icon: DocumentIcon | null;
  field_module_category: ModuleCategory | null;
  field_modulo: DocumentModule | null;
}

