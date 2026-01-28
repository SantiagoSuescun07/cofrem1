"use client";

import React, { useState } from "react";
import { Calendar, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { useCalendarEventsQuery } from "@/queries/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { BirthdaySlider } from "./birthday-slider";
import { SurveyDialog } from "./survey-dialog";
import { EventDetailModal } from "@/app/(dashboard)/calendar/_components/event-detail-modal";
import { CalendarEvent } from "@/types";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useCallback, useEffect } from "react";
import { usePollQuery } from "@/queries/encuentas/usepoll-query";

interface RightSidebarProps {
  onPlayGames?: () => void;
  onParticipateInSurvey?: () => void;
  userPoints?: number;
  userRanking?: string;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  onPlayGames,
  onParticipateInSurvey,
  userPoints = 1250,
  userRanking = "top 10",
}) => {
  const { data: polls, isLoading: isLoadingPoll } = usePollQuery();
  const { data: events, isLoading, isError } = useCalendarEventsQuery();
  const [openSurvey, setOpenSurvey] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  
  // Manejar array de encuestas
  const pollsArray = Array.isArray(polls) ? polls : [];
  const hasActivePolls = pollsArray.length > 0;
  
  // Obtener la primera encuesta para mostrar en el sidebar (si existe)
  const firstPoll = pollsArray.length > 0 ? pollsArray[0] : null;
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start" },
    [Autoplay({ delay: 4000 })]
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

  const progressPercentage = Math.min((userPoints / 2000) * 100, 100);

  // Filtrar y ordenar eventos: solo mostrar eventos de hoy y futuros
  const upcomingEvents = React.useMemo(() => {
    if (!events || events.length === 0) {
      return [];
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0); // Resetear horas para comparar solo fechas

    // Filtrar eventos de hoy o futuros (excluir eventos pasados)
    const futureEvents = events.filter((event) => {
      if (!event.date) {
        return false;
      }
      try {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        // Solo incluir eventos de hoy (eventDate >= now) o futuros
        return eventDate >= now;
      } catch (error) {
        console.error("Error parseando fecha:", event.date, error);
        return false;
      }
    });

    // Ordenar eventos por fecha (más próximos primero)
    const sortedEvents = futureEvents.sort((a, b) => {
      if (!a.date || !b.date) return 0;
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB; // Orden ascendente (más próximos primero)
    });
    
    // Tomar solo los primeros 4 eventos
    return sortedEvents.slice(0, 4);
  }, [events]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <div className="space-y-2">
      {/* Próximos eventos - Carrusel */}
      <div className="bg-white p-3 rounded-xl border border-gray-200">
        <h3 className="text-gray-900 mb-4">Próximos Eventos</h3>

        {isLoading && (
          <div className="space-y-3">
            {[1].map((i) => (
              <div
                key={i}
                className="flex items-center space-x-3 p-2 rounded-lg"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-200 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                  <div className="h-2 bg-gray-200 rounded w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="text-sm text-red-500 text-center py-4">
            <p>Error al cargar los eventos. Intenta nuevamente.</p>
            <p className="text-xs mt-2 text-gray-500">
              Verifica la consola para más detalles.
            </p>
          </div>
        )}

        {!isLoading && upcomingEvents.length > 0 && (
          <div className="relative">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex-[0_0_100%] min-w-0 px-1"
                    onClick={() => {
                      setSelectedEvent(event);
                      setIsEventModalOpen(true);
                    }}
                  >
                    <div className="flex items-center space-x-3 hover:bg-gray-50 p-2 rounded-lg transition-colors cursor-pointer">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          upcomingEvents.indexOf(event) % 2 === 0
                            ? "bg-blue-100"
                            : "bg-green-100"
                        }`}
                      >
                        {upcomingEvents.indexOf(event) % 2 === 0 ? (
                          <Calendar
                            size={16}
                            className="text-blue-600"
                          />
                        ) : (
                          <Users size={16} className="text-green-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">
                          {event.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(event.date), "dd MMM - h:mm a", {
                            locale: es,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Botones de navegación */}
            {upcomingEvents.length > 1 && (
              <>
                <button
                  onClick={scrollPrev}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 bg-white rounded-full p-1.5 shadow-md hover:bg-gray-50 transition-colors z-10"
                  aria-label="Evento anterior"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-700" />
                </button>
                <button
                  onClick={scrollNext}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 bg-white rounded-full p-1.5 shadow-md hover:bg-gray-50 transition-colors z-10"
                  aria-label="Siguiente evento"
                >
                  <ChevronRight className="w-4 h-4 text-gray-700" />
                </button>
              </>
            )}

            {/* Dots indicadores */}
            {upcomingEvents.length > 1 && (
              <div className="flex justify-center mt-3 gap-2">
                {upcomingEvents.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => emblaApi?.scrollTo(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === selectedIndex
                        ? "bg-[#306393]"
                        : "bg-gray-300"
                    }`}
                    aria-label={`Ir al evento ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {!isLoading && upcomingEvents.length === 0 && !isError && (
          <div className="text-sm text-gray-500 text-center py-4">
            <p>No hay eventos próximos.</p>
          
          </div>
        )}
      </div>

      {/* Calendario */}
      <BirthdaySlider />

      {/* Gamificación */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-3 rounded-xl border border-purple-100">
        <h3 className="text-gray-900 mb-4">🏆 Tu Progreso</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Puntos totales</span>
            <span className=" text-purple-600">
              {userPoints.toLocaleString("es-ES")}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">
            ¡Estás en el {userRanking} de la semana!
          </p>
          <button
            onClick={onPlayGames}
            className="w-full mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Jugar Ahora
          </button>
        </div>
      </div>

      {/* Encuesta */}
      <div className="bg-white px-5 py-3 rounded-xl border border-gray-200">
        <h3 className="text-gray-900 mb-4">
          {hasActivePolls && pollsArray.length > 1 
            ? `Encuestas Activas (${pollsArray.length})` 
            : "Encuesta Activa"}
        </h3>
        {isLoadingPoll ? (
          <p className="text-sm text-gray-500 mb-4">Cargando encuestas...</p>
        ) : !hasActivePolls ? (
          <p className="text-sm text-gray-600 mb-4">
            No hay encuestas activas en este momento.
          </p>
        ) : (
          <p className="text-sm text-gray-600 mb-4">
            {firstPoll?.fields?.field_title?.[0]?.value || firstPoll?.question || "Encuesta activa"}
            {pollsArray.length > 1 && (
              <span className="text-xs text-gray-500 block mt-1">
                y {pollsArray.length - 1} más
              </span>
            )}
          </p>
        )}
        <button
          onClick={() => setOpenSurvey(true)}
          disabled={!hasActivePolls || isLoadingPoll}
          className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            !hasActivePolls || isLoadingPoll
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
          }`}
        >
          {isLoadingPoll 
            ? "Cargando..." 
            : !hasActivePolls 
            ? "No hay encuestas" 
            : pollsArray.length > 1 
            ? `Ver ${pollsArray.length} encuestas` 
            : "Participar"}
        </button>
      </div>

      <SurveyDialog open={openSurvey} onClose={() => setOpenSurvey(false)} />

      {/* Modal de detalle del evento */}
      <EventDetailModal
        event={selectedEvent}
        open={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setSelectedEvent(null);
        }}
      />
    </div>
  );
};
