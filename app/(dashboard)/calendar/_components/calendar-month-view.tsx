"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { CalendarEvent, PicoYPlacaData } from "@/types";
import { Car, Clock } from "lucide-react";

interface CalendarMonthViewProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  picoYPlaca?: PicoYPlacaData;
}

export function CalendarMonthView({
  events,
  onEventClick,
  picoYPlaca,
}: CalendarMonthViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { locale: es });
  const calendarEnd = endOfWeek(monthEnd, { locale: es });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => isSameDay(new Date(event.date), day));
  };

  const getPicoYPlacaForDay = (day: Date) => {
    if (!picoYPlaca || !picoYPlaca.pico_y_placa) {
      return null;
    }
    
    const dayOfWeek = day.getDay(); // 0 = Domingo, 1 = Lunes, etc.
    const diasMap: Record<number, keyof typeof picoYPlaca.pico_y_placa> = {
      1: "Lunes",
      2: "Martes",
      3: "Miércoles",
      4: "Jueves",
      5: "Viernes",
      6: "Sábado",
      0: "Domingo",
    };
    
    const diaNombre = diasMap[dayOfWeek];
    if (!diaNombre) return null;
    
    const diaData = picoYPlaca.pico_y_placa[diaNombre];
    return diaData && diaData.placas && diaData.placas.length > 0 ? diaData : null;
  };

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl">
          {format(currentMonth, "MMMM yyyy", { locale: es })}
        </h2>
        <div className="flex gap-2">
          <Button
            className="hover:bg-[#e4fef1]"
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            className="hover:bg-[#e4fef1]"
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
          >
            Hoy
          </Button>
          <Button
            className="hover:bg-[#e4fef1]"
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border rounded-lg overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-muted">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());
            const picoYPlacaInfo = getPicoYPlacaForDay(day);

            // Debug: solo para el día actual
            if (isToday && picoYPlaca) {
              console.log("Pico y Placa para hoy:", {
                day: format(day, "EEEE", { locale: es }),
                picoYPlacaInfo,
                picoYPlacaData: picoYPlaca,
              });
            }

            return (
              <div
                key={idx}
                className={`min-h-[120px] p-2 border-t border-r ${
                  idx % 7 === 6 ? "" : ""
                } ${!isCurrentMonth ? "bg-muted/30" : ""}`}
              >
                <div
                  className={`text-sm font-medium mb-2 ${
                    isToday
                      ? "bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center"
                      : isCurrentMonth
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {format(day, "d")}
                </div>
                <div className="space-y-1">
                  {/* Pico y Placa - Solo para el día de hoy */}
                  {isToday && picoYPlacaInfo && picoYPlacaInfo.placas.length > 0 && (
                    <div className="mb-2 p-1.5 bg-orange-50 border border-orange-200 rounded text-xs">
                      <div className="flex items-center gap-1 mb-1">
                        <Car className="w-3 h-3 text-orange-600" />
                        <span className="font-semibold text-orange-700">Pico y Placa</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-1">
                        {picoYPlacaInfo.placas.map((placa, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 bg-orange-600 text-white rounded text-[10px]"
                          >
                            {placa}
                          </span>
                        ))}
                      </div>
                      {picoYPlacaInfo.horarios.length > 0 && (
                        <div className="flex items-center gap-1 text-orange-600">
                          <Clock className="w-2.5 h-2.5" />
                          <span className="text-[10px]">
                            {picoYPlacaInfo.horarios.map((h, i) => (
                              <span key={i}>
                                {h.inicio}-{h.fin}
                                {i < picoYPlacaInfo.horarios.length - 1 && ", "}
                              </span>
                            ))}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Eventos */}
                  {dayEvents.slice(0, 3).map((event) => (
                    <button
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className="w-full text-left text-xs p-1 rounded hover:bg-muted/50 transition-colors truncate border-l-2"
                      style={{
                        borderLeftColor: `var(--color-event-${event.eventType.name.toLowerCase()}, var(--color-primary))`,
                      }}
                    >
                      {format(new Date(event.date), "HH:mm")} {event.title}
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-muted-foreground pl-1">
                      +{dayEvents.length - 3} más
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
