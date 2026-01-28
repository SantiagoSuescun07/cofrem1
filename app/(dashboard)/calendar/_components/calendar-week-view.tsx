"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, addWeeks, subWeeks } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarEvent, PicoYPlacaData } from "@/types"
import { Car, Clock } from "lucide-react"

interface CalendarWeekViewProps {
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  picoYPlaca?: PicoYPlacaData
}

export function CalendarWeekView({ events, onEventClick, picoYPlaca }: CalendarWeekViewProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date())

  const weekStart = startOfWeek(currentWeek, { locale: es })
  const weekEnd = endOfWeek(currentWeek, { locale: es })
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const getEventsForDay = (day: Date) => {
    return events
      .filter((event) => isSameDay(new Date(event.date), day))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

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
  }

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl">
          {format(weekStart, "d MMM", { locale: es })} - {format(weekEnd, "d MMM yyyy", { locale: es })}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentWeek(new Date())}>
            Hoy
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Week Grid */}
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const dayEvents = getEventsForDay(day)
            const isToday = isSameDay(day, new Date())
            const picoYPlacaInfo = getPicoYPlacaForDay(day)

            return (
              <div key={idx} className={`min-h-[400px] p-3 border-r last:border-r-0 ${isToday ? "bg-accent/5" : ""}`}>
                <div className="text-center mb-3">
                  <div className="text-xs text-muted-foreground uppercase">{format(day, "EEE", { locale: es })}</div>
                  <div
                    className={`text-lg font-semibold ${
                      isToday
                        ? "bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center mx-auto"
                        : ""
                    }`}
                  >
                    {format(day, "d")}
                  </div>
                </div>
                <div className="space-y-2">
                  {/* Pico y Placa - Solo para el día de hoy */}
                  {isToday && picoYPlacaInfo && picoYPlacaInfo.placas.length > 0 && (
                    <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Car className="w-4 h-4 text-orange-600" />
                        <span className="font-semibold text-orange-700 text-xs">Pico y Placa</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {picoYPlacaInfo.placas.map((placa, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-orange-600 text-white rounded text-xs"
                          >
                            {placa}
                          </span>
                        ))}
                      </div>
                      {picoYPlacaInfo.horarios.length > 0 && (
                        <div className="flex items-center gap-1.5 text-orange-600">
                          <Clock className="w-3 h-3" />
                          <span className="text-xs">
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
                  {dayEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className="w-full text-left text-xs p-2 rounded hover:bg-muted/50 transition-colors border-l-2"
                      style={{
                        borderLeftColor: `var(--color-event-${event.eventType.name.toLowerCase()}, var(--color-primary))`,
                      }}
                    >
                      <div className="font-mono text-muted-foreground mb-1">
                        {format(new Date(event.date), "HH:mm")}
                      </div>
                      <div className="font-medium line-clamp-2">{event.title}</div>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
