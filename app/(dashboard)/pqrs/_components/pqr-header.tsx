import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import React from "react";

interface PQRModalProps {
  setIsModalOpen: (value: boolean) => void;
}

export function PQRHeader({ setIsModalOpen }: PQRModalProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl text-balance">Sistema de PQR</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona tus Peticiones, Quejas y Reclamos de manera eficiente
        </p>
      </div>
      <Button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 bg-primary hover:bg-primary/90"
      >
        <Plus className="h-4 w-4" />
        Nueva PQR
      </Button>
    </div>
  );
}
