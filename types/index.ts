export interface User {
  name: string;
  email: string;
  avatar: string;
  role: string;
  area: string;
  sede: string;
}

export interface NewsItem {
  id: number;
  title: string;
  summary: string;
  date: string;
  category: "RRHH" | "Bienestar" | "Formación";
  author: string;
  reactions: number;
  comments: number;
  priority: "high" | "medium" | "low";
}

export interface QuickAccessItem {
  name: string;
  icon: string;
  category: "personal" | "sistemas" | "documentos" | "comunicacion";
}

export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  url: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  type: "meeting" | "training" | "event";
}

export interface Birthday {
  id: string;
  name: string;
  area: string;
  date: string;
}

export type ModuleType =
  | "dashboard"
  | "news"
  | "directory"
  | "documents"
  | "calendar"
  | "employee"
  | "games"
  | "settings";

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  place: string;
  mapLink: {
    uri: string;
    title: string;
  };
  infoButton: {
    uri: string;
    title: string;
  };
  isNotificationsEnabled: boolean;
  eventType: {
    id: string;
    name: string;
  };
  dependencies: {
    id: string;
    name: string;
  };
  image: {
    url: string;
    alt: string;
  };
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime: string;
    date?: string;
  };
  end: {
    dateTime: string;
    date?: string;
  };
  isPersonal: boolean;
}

export type CalendarView = "month" | "week" | "list";

export interface PicoYPlacaInfo {
  date: string;
  numbers: number[];
}

export interface PicoYPlacaHorario {
  inicio: string;
  fin: string;
}

export interface PicoYPlacaDia {
  placas: string[];
  horarios: PicoYPlacaHorario[];
}

export interface PicoYPlacaData {
  pico_y_placa: {
    Lunes: PicoYPlacaDia;
    Martes: PicoYPlacaDia;
    Miércoles: PicoYPlacaDia;
    Jueves: PicoYPlacaDia;
    Viernes: PicoYPlacaDia;
    Sábado: PicoYPlacaDia;
    Domingo: PicoYPlacaDia;
  };
}
