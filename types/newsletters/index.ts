export type Newsletter = {
  id: string;
  drupal_internal__nid: number;
  title: string;
  description: string | null;
  created: string;
  field_attachments: { id: string; url: string }[];
  field_category_report: { id: string; tid: number; name: string } | null;
  field_main_image: {
    id: string;
    url: string;
    alt: string;
    title: string;
    width: number;
    height: number;
  } | null;
  field_report_pdf: { id: string; url: string } | null;
  field_type_report: { id: string; tid: number; name: string } | null;
  field_link: string | null;
};
