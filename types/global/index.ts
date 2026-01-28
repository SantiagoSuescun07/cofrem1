export interface TaxonomyTerm {
  id: string; // UUID
  tid?: number; // Drupal internal TID
  name: string;
}

export interface TaxonomyApiResponse {
  data: Array<{
    id: string;
    type: string;
    attributes: {
      name: string;
      drupal_internal__tid?: number;
      [key: string]: any;
    };
  }>;
}