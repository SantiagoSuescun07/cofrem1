"use client"

import { Calendar, MapPin, Car, Clock } from "lucide-react"
import { format, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarEvent, PicoYPlacaData } from "@/types"

interface CalendarListViewProps {
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  picoYPlaca?: PicoYPlacaData
}

export function CalendarListView({ events, onEventClick, picoYPlaca }: CalendarListViewProps) {
  // Group events by date
  const groupedEvents = events.reduce(
    (acc, event) => {
      const dateKey = format(new Date(event.date), "yyyy-MM-dd")
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(event)
      return acc
    },
    {} as Record<string, CalendarEvent[]>,
  )

  // Sort dates
  const sortedDates = Object.keys(groupedEvents).sort()

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
    <div className="space-y-6">
      <h2 className="text-2xl">Agenda de Eventos</h2>

      <div className="space-y-6">
        {sortedDates.map((dateKey) => {
          const date = new Date(dateKey)
          const dayEvents = groupedEvents[dateKey].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
          )
          const isToday = isSameDay(date, new Date())

          return (
            <div key={dateKey} className="space-y-3">
              {/* Date Header */}
              <div className={`flex items-center gap-3 pb-2 border-b ${isToday ? "border-primary" : ""}`}>
                <Calendar className={`h-5 w-5 ${isToday ? "text-primary" : "text-muted-foreground"}`} />
                <div>
                  <h3 className={`font-semibold ${isToday ? "text-primary" : ""}`}>
                    {format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                  </h3>
                  {isToday && <span className="text-xs text-primary">Hoy</span>}
                </div>
              </div>

              {/* Pico y Placa - Solo para el día de hoy */}
              {(() => {
                const picoYPlacaInfo = getPicoYPlacaForDay(date);
                return isToday && picoYPlacaInfo && picoYPlacaInfo.placas.length > 0 ? (
                  <div className="mb-4 pl-8">
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Car className="w-4 h-4 text-orange-600" />
                        <span className="font-semibold text-orange-700">Pico y Placa</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {picoYPlacaInfo.placas.map((placa, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 bg-orange-600 text-white rounded text-sm"
                          >
                            {placa}
                          </span>
                        ))}
                      </div>
                      {picoYPlacaInfo.horarios.length > 0 && (
                        <div className="flex items-center gap-2 text-orange-600">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">
                            {picoYPlacaInfo.horarios.map((h, i) => (
                              <span key={i}>
                                {h.inicio} - {h.fin}
                                {i < picoYPlacaInfo.horarios.length - 1 && ", "}
                              </span>
                            ))}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Events List */}
              <div className="space-y-2 pl-8">
                {dayEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className="w-full text-left p-4 rounded-lg border hover:border-primary hover:bg-muted/50 transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-sm font-mono text-muted-foreground min-w-[60px] pt-1">
                        {format(new Date(event.date), "HH:mm")}
                      </div>
                      <div
                        className="w-1 h-full rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: `var(--color-event-${event.eventType.name.toLowerCase()}, var(--color-primary))`,
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                          {event.title}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span>{event.place}</span>
                        </div>
                        <div className="mt-2">
                          <span className="text-xs bg-muted px-2 py-1 rounded">{event.eventType.name}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )
        })}

        {sortedDates.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay eventos programados</p>
          </div>
        )}
      </div>
    </div>
  )
}
