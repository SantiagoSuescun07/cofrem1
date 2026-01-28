"use client";

import {
  X,
  Calendar,
  MapPin,
  ExternalLink,
  Plus,
  Building2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Image from "next/image";
import { CalendarEvent } from "@/types";
import {
  generateGoogleCalendarUrl,
  getPicoYPlacaForDate,
} from "@/services/calendar/get-calendar";

interface EventDetailModalProps {
  event: CalendarEvent | null;
  open: boolean;
  onClose: () => void;
}

export function EventDetailModal({
  event,
  open,
  onClose,
}: EventDetailModalProps) {
  if (!event) return null;

  const eventDate = new Date(event.date);
  const picoYPlaca = getPicoYPlacaForDate(eventDate);
  const googleCalendarUrl = generateGoogleCalendarUrl(event);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">{event.title}</DialogTitle>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </button>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event Image */}
          <div className="relative w-full h-64 rounded-lg overflow-hidden bg-muted">
            <Image
              src={event.image.url || "/placeholder.svg"}
              alt={event.image.alt}
              fill
              className="object-cover"
            />
          </div>

          {/* Event Title and Type */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-2">
              <h2 className="text-3xl text-balance">{event.title}</h2>
              <Badge variant="secondary">{event.eventType.name}</Badge>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <p>{event.dependencies.name}</p>
            </div>
          </div>

          {/* Event Details */}
          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Fecha y Hora</p>
                <p className="text-muted-foreground font-mono">
                  {format(eventDate, "EEEE, d 'de' MMMM 'de' yyyy", {
                    locale: es,
                  })}
                </p>
                <p className="text-muted-foreground font-mono">
                  {format(eventDate, "HH:mm", { locale: es })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Lugar</p>
                <p className="text-muted-foreground">{event.place}</p>
                {event.mapLink.uri && (
                  <a
                    href={event.mapLink.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-1"
                  >
                    {event.mapLink.title || "Cómo llegar"}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg mb-2">Descripción</h3>
            <div
              className="prose prose-sm max-w-none text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: event.description }}
            />
          </div>

          {/* Pico y Placa Information */}
          {picoYPlaca.length > 0 && (
            <div className="bg-muted rounded-lg p-4">
              <h3 className="mb-2">
                Información de Pico y Placa
              </h3>
              <p className="text-sm text-muted-foreground">
                Para la fecha de este evento, el Pico y Placa en Villavicencio
                aplica para vehículos con placas terminadas en:{" "}
                <span className="text-foreground">
                  {picoYPlaca.join(" y ")}
                </span>
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              onClick={() => window.open(googleCalendarUrl, "_blank")}
              className="flex-1 gap-2 min-w-0 whitespace-normal text-wrap h-auto py-2"
            >
              <Plus className="h-4 w-4 flex-shrink-0" />
              <span className="line-clamp-2 text-center">Añadir a Google Calendar</span>
            </Button>
            {event.infoButton.uri && (
              <Button
                variant="outline"
                onClick={() => window.open(event.infoButton.uri, "_blank")}
                className="flex-1 gap-2 min-w-0 whitespace-normal text-wrap h-auto py-2"
              >
                <span className="line-clamp-2 text-center">{event.infoButton.title}</span>
                <ExternalLink className="h-4 w-4 flex-shrink-0" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
