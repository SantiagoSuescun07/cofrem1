"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { CalendarEvent, CalendarView } from "@/types";
import { EventDetailModal } from "./_components/event-detail-modal";
import { CalendarListView } from "./_components/calendar-list-view";
import { CalendarMonthView } from "./_components/calendar-month-view";
import { CalendarWeekView } from "./_components/calendar-week-view";
import { CalendarViewToggle } from "./_components/calendar-view-toggle";
import { BreadcrumbNav } from "./_components/breadcrumb-nav";
import { useCalendarEventsQuery, usePicoYPlacaQuery } from "@/queries/calendar";

export default function CalendarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<CalendarView>("month");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // 👇 Hook de React Query (sin useEffect)
  const { data: events = [], isLoading, isError } = useCalendarEventsQuery();
  const { data: picoYPlaca, isLoading: isLoadingPicoYPlaca, isError: isErrorPicoYPlaca } = usePicoYPlacaQuery();

  // Debug: verificar datos de pico y placa
  useEffect(() => {
    if (picoYPlaca) {
      console.log("Pico y Placa data:", picoYPlaca);
    }
    if (isErrorPicoYPlaca) {
      console.error("Error cargando pico y placa");
    }
  }, [picoYPlaca, isErrorPicoYPlaca]);

  // Abrir evento si viene en query params (desde notificaciones)
  useEffect(() => {
    const eventId = searchParams?.get("eventId");
    if (eventId && events.length > 0) {
      const event = events.find((e) => e.id === eventId);
      if (event) {
        setSelectedEvent(event);
        // Limpiar el query param después de abrir el evento
        router.replace("/calendar", { scroll: false });
      }
    }
  }, [searchParams, events, router]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 md:px-10 py-8 max-w-7xl">
        <BreadcrumbNav />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl mb-2">Calendario de Eventos</h1>
            <p className="text-muted-foreground">
              Consulta todos los eventos corporativos programados
            </p>
          </div>
          <CalendarViewToggle view={view} onViewChange={setView} />
        </div>


        {/* Loading */}
        {isLoading || isLoadingPicoYPlaca ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <p className="text-center text-muted-foreground py-20">
            Error al cargar los eventos
          </p>
        ) : (
          <>
            {view === "month" && (
              <CalendarMonthView
                events={events}
                onEventClick={setSelectedEvent}
                picoYPlaca={picoYPlaca}
              />
            )}
            {view === "week" && (
              <CalendarWeekView
                events={events}
                onEventClick={setSelectedEvent}
                picoYPlaca={picoYPlaca}
              />
            )}
            {view === "list" && (
              <CalendarListView
                events={events}
                onEventClick={setSelectedEvent}
                picoYPlaca={picoYPlaca}
              />
            )}
          </>
        )}

        <EventDetailModal
          event={selectedEvent}
          open={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      </div>
    </div>
  );
}
