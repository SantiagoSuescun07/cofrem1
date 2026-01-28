import { NewsItem, QuickAccessItem, SidebarItem } from '../types';

export const newsData: NewsItem[] = [
  {
    id: 1,
    title: 'Nueva Política de Trabajo Remoto',
    summary: 'COFREM implementa modalidad híbrida para mejorar el equilibrio laboral de todos los colaboradores.',
    date: '2025-07-07',
    category: 'RRHH',
    author: 'Dirección General',
    reactions: 24,
    comments: 8,
    priority: 'high'
  },
  {
    id: 2,
    title: 'Lanzamiento Programa de Bienestar',
    summary: 'Nuevas actividades recreativas y de salud para todos los colaboradores en todas las sedes.',
    date: '2025-07-06',
    category: 'Bienestar',
    author: 'Área de Bienestar',
    reactions: 31,
    comments: 12,
    priority: 'medium'
  },
  {
    id: 3,
    title: 'Capacitación en Google Workspace',
    summary: 'Inscripciones abiertas para cursos de herramientas colaborativas.',
    date: '2025-07-05',
    category: 'Formación',
    author: 'Área de TI',
    reactions: 18,
    comments: 5,
    priority: 'medium'
  }
];

export const quickAccessData: QuickAccessItem[] = [
  { name: 'Comprobante de Nómina', icon: 'Download', category: 'personal' },
  { name: 'Solicitar Vacaciones', icon: 'Calendar', category: 'personal' },
  { name: 'Seven Sistema', icon: 'Building', category: 'sistemas' },
  { name: 'Gestión Documental', icon: 'FileText', category: 'documentos' },
  { name: 'Directorio', icon: 'Users', category: 'comunicacion' },
  { name: 'PQRS Interno', icon: 'MessageCircle', category: 'comunicacion' },
  { name: 'Sercliente Web', icon: 'Globe', category: 'sistemas' },
  { name: 'Presupuesto en Línea', icon: 'Briefcase', category: 'documentos' }
];
