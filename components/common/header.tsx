"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Menu, Search, Bell, X, Check, Calendar, FileText, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { useNotifications, useMarkNotificationAsRead } from "@/queries/notifications";
import { useNotificationEntity } from "@/queries/notifications/get-notification-entity";
import { Notification } from "@/types/notifications";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Image from "next/image";
import { MapPin, ExternalLink } from "lucide-react";
import { useSearch } from "@/queries/search/use-search";
import { SearchResult } from "@/services/search/search-content";

interface HeaderProps {
  onMenuClick: () => void;
  notifications?: number;
  onSearch?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  notifications: initialNotifications = 0,
  onSearch,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Búsqueda con debounce
  const { data: searchResults, isLoading: isSearchLoading } = useSearch(searchQuery);

  // Usar React Query para obtener notificaciones
  const { data: notifications = [], isLoading, refetch } = useNotifications();
  const markAsReadMutation = useMarkNotificationAsRead();
  
  // Obtener datos de la entidad relacionada cuando hay una notificación seleccionada
  const { data: entityData, isLoading: isLoadingEntity } = useNotificationEntity(
    selectedNotification?.link || null,
    selectedNotification?.entity_bundle
  );

  // Función para obtener el título a mostrar
  const getDisplayTitle = (): string => {
    if (entityData && entityData.data && entityData.type === "publication") {
      const publication = entityData.data as import("@/types/publications").Publication;
      return publication.title;
    }
    // Si no hay publicación cargada aún, extraer el título del formato "Publicación actualizada (Título)"
    if (selectedNotification?.title) {
      const match = selectedNotification.title.match(/\(([^)]+)\)/);
      return match ? match[1] : selectedNotification.title;
    }
    return "";
  };

  // Cerrar dropdowns al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
      }
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };

    if (isNotificationOpen || isSearchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotificationOpen, isSearchOpen]);

  // Refrescar notificaciones cuando se abre el dropdown
  useEffect(() => {
    if (isNotificationOpen) {
      refetch();
    }
  }, [isNotificationOpen, refetch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setSearchQuery(value);
    setIsSearchOpen(value.length >= 2);
    
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  const handleSearchResultClick = (result: SearchResult) => {
    router.push(result.url);
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  const getTypeLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "news":
        return "Noticia";
      case "publication":
        return "Publicación";
      case "newsletter":
        return "Boletín";
      case "directory":
        return "Directorio";
      case "magazine":
        return "Revista Enlace";
      default:
        return "Contenido";
    }
  };

  const handleNotificationClick = (): void => {
    setIsNotificationOpen(!isNotificationOpen);
  };

  const handleMarkAsRead = async (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  const handleNotificationItemClick = (notification: Notification) => {
    // Marcar como leída si no lo está
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }

    // Abrir el modal con la información de la notificación
    setSelectedNotification(notification);
    setIsNotificationOpen(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNotification(null);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "calendar_notification":
      case "calendar_reminder":
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case "publication_notification":
        return <FileText className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case "calendar_notification":
        return "Evento de Calendario";
      case "calendar_reminder":
        return "Recordatorio de Calendario";
      case "publication_notification":
        return "Publicación";
      default:
        return "Notificación";
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  // Solo mostrar el conteo si hay notificaciones no leídas
  const displayCount = unreadCount;

  // Debug: verificar estado de notificaciones
  useEffect(() => {
    if (notifications.length === 0 && unreadCount > 0) {
      console.warn("Hay notificaciones no leídas pero el array está vacío:", {
        notificationsLength: notifications.length,
        unreadCount,
        isLoading,
      });
    }
  }, [notifications, unreadCount, isLoading]);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="px-3 md:px-6 py-3 md:py-4">
        {/* Fila principal: Todo en una sola línea */}
        <div className="flex items-center justify-between gap-3">
          {/* Izquierda: Menú y búsqueda */}
          <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
            {/* Menú hamburguesa - solo visible en móvil/tablet */}
            <button
              onClick={onMenuClick}
              className={cn(
                "p-2 rounded-lg hover:bg-gray-100 flex-shrink-0 transition-colors",
                pathname.startsWith("/nosotros") ? "lg:hidden" : "lg:hidden"
              )}
              aria-label="Abrir menú"
            >
              <Menu size={20} className="text-gray-700" />
            </button>
            
            {/* Búsqueda */}
            <div className="relative flex-1 min-w-0 max-w-full md:max-w-md" ref={searchRef}>
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search
                  size={20}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10"
                />
                <input
                  type="text"
                  placeholder="Buscar en COFREM..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => {
                    if (searchQuery.length >= 2) {
                      setIsSearchOpen(true);
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder:text-gray-400"
                />
              </form>

              {/* Dropdown de resultados de búsqueda */}
              {isSearchOpen && searchQuery.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[500px] overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between p-3 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Resultados de búsqueda
                    </h3>
                    <button
                      onClick={() => setIsSearchOpen(false)}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      aria-label="Cerrar búsqueda"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="overflow-y-auto flex-1">
                    {isSearchLoading ? (
                      <div className="p-8 text-center text-gray-500">
                        <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin" />
                        <p className="text-sm">Buscando...</p>
                      </div>
                    ) : searchResults?.results && searchResults.results.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {searchResults.results.map((result) => (
                          <button
                            key={`${result.type}-${result.id}`}
                            onClick={() => handleSearchResultClick(result)}
                            className="w-full p-3 hover:bg-gray-50 cursor-pointer transition-colors text-left"
                          >
                            <div className="flex items-start gap-3">
                              {result.image && (
                                <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                                  <Image
                                    src={result.image.url}
                                    alt={result.image.alt}
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                    {getTypeLabel(result.type)}
                                  </span>
                                </div>
                                <h4 className="text-sm font-medium text-gray-900 truncate">
                                  {result.title}
                                </h4>
                                {result.description && (
                                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                    {result.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                        {searchResults.total > searchResults.results.length && (
                          <div className="p-3 border-t border-gray-200">
                            <button
                              onClick={handleSearchSubmit}
                              className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Ver todos los resultados ({searchResults.total})
                            </button>
                          </div>
                        )}
                      </div>
                    ) : searchQuery.length >= 2 ? (
                      <div className="p-8 text-center text-gray-500">
                        <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No se encontraron resultados</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Derecha: Navegación y notificaciones */}
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            {/* Navegación - oculta en móvil, visible en desktop */}
            <nav className="hidden md:flex items-center gap-4 lg:gap-6">
              <Link
                href="/newsletters"
                className={cn(
                  "text-sm font-medium text-gray-700 hover:text-primary transition-colors whitespace-nowrap",
                  pathname === "/newsletters" ||
                    pathname.startsWith("/newsletters" + "/")
                    ? "text-primary"
                    : ""
                )}
              >
                Boletín Interno
              </Link>
              <a
                href="/revista"
                className="text-sm font-medium text-gray-700 hover:text-primary transition-colors whitespace-nowrap"
              >
                Revista Enlace
              </a>
            </nav>

            {/* Notificaciones */}
            <div className="relative" ref={notificationRef}>
              <button
              onClick={handleNotificationClick}
              className="relative p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label={`Notificaciones${
                displayCount > 0 ? ` (${displayCount})` : ""
              }`}
            >
              <Bell size={20} />
              {displayCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                  {displayCount > 9 ? "9+" : displayCount}
                </span>
              )}
            </button>

            {/* Dropdown de notificaciones */}
            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] md:w-96 max-w-md bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h3 className="text-lg font-normal text-gray-900">
                    Notificaciones
                    {unreadCount > 0 && (
                      <span className="ml-2 text-sm text-red-500">
                        ({unreadCount} nuevas)
                      </span>
                    )}
                  </h3>
                  <button
                    onClick={() => setIsNotificationOpen(false)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Cerrar notificaciones"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="overflow-y-auto flex-1">
                  {isLoading ? (
                    <div className="p-8 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                      <p>Cargando notificaciones...</p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Bell size={48} className="mx-auto mb-2 text-gray-300" />
                      <p>No hay notificaciones</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={cn(
                            "p-4 hover:bg-gray-50 cursor-pointer transition-colors relative",
                            !notification.is_read && "bg-blue-50"
                          )}
                          onClick={() => handleNotificationItemClick(notification)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4
                                  className={cn(
                                    "text-sm font-normal truncate",
                                    !notification.is_read
                                      ? "text-gray-900"
                                      : "text-gray-700"
                                  )}
                                >
                                  {notification.title}
                                </h4>
                                {!notification.is_read && (
                                  <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                                )}
                              </div>
                              <div
                                className="text-xs text-gray-600 mb-2 line-clamp-2"
                                dangerouslySetInnerHTML={{
                                  __html: notification.message,
                                }}
                              />
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                  {new Date(
                                    notification.timestamp * 1000
                                  ).toLocaleDateString("es-ES", {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                <button
                                  onClick={(e) =>
                                    handleMarkAsRead(notification, e)
                                  }
                                  className={cn(
                                    "p-1 rounded hover:bg-gray-200 transition-colors",
                                    notification.is_read && "opacity-50"
                                  )}
                                  aria-label={
                                    notification.is_read
                                      ? "Marcada como leída"
                                      : "Marcar como leída"
                                  }
                                >
                                  <Check
                                    size={14}
                                    className={cn(
                                      notification.is_read
                                        ? "text-green-500"
                                        : "text-gray-400"
                                    )}
                                  />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de detalle de notificación */}
      {selectedNotification && (
        <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="sr-only">
                Detalle de Notificación
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Header de la notificación */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  {getNotificationIcon(selectedNotification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-semibold text-gray-900">
                      {getDisplayTitle()}
                    </h2>
                    {!selectedNotification.is_read && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        Nueva
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      {format(
                        new Date(selectedNotification.timestamp * 1000),
                        "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm",
                        { locale: es }
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                      {getNotificationTypeLabel(selectedNotification.type)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mensaje de la notificación */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div
                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: selectedNotification.message,
                  }}
                />
              </div>

              {/* Cargando información de la entidad */}
              {isLoadingEntity && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-gray-500">Cargando información...</span>
                  </div>
                </div>
              )}

              {/* Información de la entidad relacionada (Publicación o Evento) */}
              {!isLoadingEntity && entityData && entityData.data && (
                <div className=" border-gray-200 pt-4 space-y-4">
                  {entityData.type === "publication" && entityData.data && (
                    (() => {
                      const publication = entityData.data as import("@/types/publications").Publication;
                      return (
                        <div className="space-y-4">
                          {/* Imagen de la publicación */}
                          {publication.field_image && (
                            <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-100">
                              <Image
                                src={publication.field_image.url}
                                alt={publication.field_image.alt}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}

                          {/* Descripción de la publicación */}
                          {publication.description && (
                            <div
                              className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{
                                __html: publication.description,
                              }}
                            />
                          )}

                          {/* Galería de imágenes */}
                          {publication.field_gallery && publication.field_gallery.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                              {publication.field_gallery.map((image) => (
                                <div
                                  key={image.id}
                                  className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
                                >
                                  <Image
                                    src={image.url}
                                    alt={image.alt}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Links adicionales */}
                          {(publication.field_any_link || publication.field_video_link) && (
                            <div className="flex gap-2 pt-2">
                              {publication.field_any_link && (
                                <a
                                  href={publication.field_any_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  Ver enlace
                                </a>
                              )}
                              {publication.field_video_link && (
                                <a
                                  href={publication.field_video_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  Ver video
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()
                  )}

                  {entityData.type === "calendar" && entityData.data && (
                    (() => {
                      const event = entityData.data as import("@/types").CalendarEvent;
                      return (
                        <div className="space-y-4">
                          {/* Imagen del evento */}
                          {event.image && (
                            <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-100">
                              <Image
                                src={event.image.url}
                                alt={event.image.alt}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}

                          {/* Información del evento */}
                          <div className="space-y-3">
                            <h4 className="text-xl font-semibold text-gray-900">
                              {event.title}
                            </h4>

                            {event.description && (
                              <div
                                className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{
                                  __html: event.description,
                                }}
                              />
                            )}

                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {format(
                                    new Date(event.date),
                                    "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm",
                                    { locale: es }
                                  )}
                                </span>
                              </div>

                              {event.place && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <MapPin className="h-4 w-4" />
                                  <span>{event.place}</span>
                                </div>
                              )}

                              <div className="flex items-center gap-2 text-sm">
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                  {event.eventType.name}
                                </span>
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                  {event.dependencies.name}
                                </span>
                              </div>
                            </div>

                            {/* Links del evento */}
                            {(event.mapLink.uri || event.infoButton.uri) && (
                              <div className="flex gap-2 pt-2">
                                {event.mapLink.uri && (
                                  <a
                                    href={event.mapLink.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                  >
                                    <MapPin className="h-4 w-4" />
                                    {event.mapLink.title}
                                  </a>
                                )}
                                {event.infoButton.uri && (
                                  <a
                                    href={event.infoButton.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    {event.infoButton.title}
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              )}

              {/* Botones de acción */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex gap-3">
                  {/* Botón Ver publicación (solo para publicaciones) */}
                  {entityData && entityData.data && entityData.type === "publication" && (
                    <Link
                      href={`/publications/${(entityData.data as import("@/types/publications").Publication).id}`}
                      onClick={handleCloseModal}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-base"
                    >
                      <ExternalLink className="h-5 w-5" />
                      Ver publicación
                    </Link>
                  )}
                  {/* Botón para marcar como leída/desleída */}
                  <button
                    onClick={() => {
                      if (!selectedNotification.is_read) {
                        markAsReadMutation.mutate(selectedNotification.id);
                      }
                    }}
                    disabled={selectedNotification.is_read}
                    className={cn(
                      "flex-1 px-6 py-3 rounded-lg font-medium transition-colors text-base",
                      selectedNotification.is_read
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700"
                    )}
                  >
                    {selectedNotification.is_read ? (
                      <>
                        <Check className="h-5 w-5 inline mr-2" />
                        Marcada como leída
                      </>
                    ) : (
                      <>
                        <Check className="h-5 w-5 inline mr-2" />
                        Marcar como leída
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </header>
  );
};
