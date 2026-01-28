export interface Notification {
  id: string;
  provider_id: string;
  title: string;
  message: string;
  timestamp: number;
  type: "calendar_notification" | "calendar_reminder" | "publication_notification";
  is_read: boolean;
  link: string;
  entity_type: string;
  entity_bundle: string;
  entity_uuid: string;
  entity_id?: string;
  entity_title?: string;
}

