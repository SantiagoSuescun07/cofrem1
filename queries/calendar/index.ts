// src/queries/calendar.ts
import { useQuery } from "@tanstack/react-query";
import { fetchCalendarEvents } from "@/services/calendar/get-calendar";
import { fetchPicoYPlaca } from "@/services/calendar/get-pico-y-placa";

export const CALENDAR_EVENTS_QUERY_KEY = "calendarEvents";
export const PICO_Y_PLACA_QUERY_KEY = "picoYPlaca";

export function useCalendarEventsQuery() {
  return useQuery({
    queryKey: [CALENDAR_EVENTS_QUERY_KEY],
    queryFn: fetchCalendarEvents,
    staleTime: 1000 * 60 * 5, // 5 minutos de caché
    retry: 2, // reintenta 2 veces en caso de error
  });
}

export function usePicoYPlacaQuery() {
  return useQuery({
    queryKey: [PICO_Y_PLACA_QUERY_KEY],
    queryFn: fetchPicoYPlaca,
    staleTime: 1000 * 60 * 60, // 1 hora de caché (los datos de pico y placa no cambian frecuentemente)
    retry: 2,
  });
}
