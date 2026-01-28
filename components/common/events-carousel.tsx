"use client";

import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useEffect, useState, useCallback } from "react";
import { useCalendarEventsQuery } from "@/queries/calendar";
import { CalendarEvent } from "@/types";
import { Calendar, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Image from "next/image";
import { EventDetailModal } from "@/app/(dashboard)/calendar/_components/event-detail-modal";
import { Loader2 } from "lucide-react";

export function EventsCarousel() {
  const { data: events = [], isLoading, isError } = useCalendarEventsQuery();
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start" },
    [Autoplay({ delay: 4000 })]
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Ordenar eventos por fecha y tomar los próximos 4
  const upcomingEvents = events
    .filter((event) => new Date(event.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);

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

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Próximos Eventos
        </h3>
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-[#306393]" />
        </div>
      </div>
    );
  }

  if (isError || upcomingEvents.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Próximos Eventos
        </h3>
        <p className="text-sm text-gray-500 text-center py-6">
          No hay eventos próximos programados.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Próximos Eventos
      </h3>

      <div className="relative">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="flex-[0_0_100%] min-w-0 px-2"
                onClick={() => {
                  setSelectedEvent(event);
                  setIsModalOpen(true);
                }}
              >
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all border border-blue-100">
                  <div className="flex gap-4">
                    {/* Imagen del evento */}
                    {event.image?.url && (
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={event.image.url}
                          alt={event.image.alt || event.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}

                    {/* Información del evento */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {event.title}
                      </h4>

                      <div className="space-y-1.5 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">
                            {format(new Date(event.date), "dd MMM yyyy - h:mm a", {
                              locale: es,
                            })}
                          </span>
                        </div>

                        {event.place && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{event.place}</span>
                          </div>
                        )}

                        {event.eventType && (
                          <div className="mt-2">
                            <span className="inline-block px-2 py-1 text-xs font-medium bg-[#306393] text-white rounded">
                              {event.eventType.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
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
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors z-10"
              aria-label="Evento anterior"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={scrollNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors z-10"
              aria-label="Siguiente evento"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </>
        )}

        {/* Dots indicadores */}
        {upcomingEvents.length > 1 && (
          <div className="flex justify-center mt-4 gap-2">
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

      {/* Modal de detalle del evento */}
      <EventDetailModal
        event={selectedEvent}
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(null);
        }}
      />
    </div>
  );
}

