"use client";

import { Calendar, List, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarView } from "@/types";

interface CalendarViewToggleProps {
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
}

export function CalendarViewToggle({
  view,
  onViewChange,
}: CalendarViewToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
      <Button
        variant={view === "month" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("month")}
        className=" gap-2 hover:bg-[#e4fef1]"
      >
        <Calendar className="h-4 w-4" />
        <span className="hidden sm:inline">Mes</span>
      </Button>
      <Button
        variant={view === "week" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("week")}
        className="gap-2 hover:bg-[#e4fef1]"
      >
        <CalendarDays className="h-4 w-4" />
        <span className="hidden sm:inline">Semana</span>
      </Button>
      <Button
        variant={view === "list" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("list")}
        className="gap-2 hover:bg-[#e4fef1]"
      >
        <List className="h-4 w-4" />
        <span className="hidden sm:inline">Agenda</span>
      </Button>
    </div>
  );
}
