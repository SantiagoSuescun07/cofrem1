// Define the interface for the News item based on required fields

export interface News {
  id: string;
  drupal_internal__nid: number;
  title: string;
  body: string;
  created: string;
  comments: {
    status: number;
    cid: number;
    last_comment_timestamp: number;
    last_comment_name: string;
    last_comment_uid: number;
    comment_count: number;
  };
  field_file_new: {
    id: string;
    url: string;
    display: boolean;
    description: string;
    filename: string;
  } | null;
  field_gallery: Array<{
    id: string;
    url: string;
    alt: string;
    title: string;
    width: number;
    height: number;
  }>;
  field_main_image: {
    id: string;
    url: string;
    alt: string;
    title: string;
    width: number;
    height: number;
  } | null;
  field_segmentation: Array<{
    id: string;
    name: string;
    type: string;
  }>;
}

// Define the interface for a User
interface User {
  id: string;
  name: string;
}

// Define the interface for a Comment (updated to include user)
export interface Comment {
  id: string;
  body: string; // field_body_default
  created: string;
  user: User | null; // Added user field
}
