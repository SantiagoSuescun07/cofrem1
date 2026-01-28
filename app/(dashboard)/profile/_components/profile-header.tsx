"use client";

import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileBreadcrumb } from "./profile-breadcrumb";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

// Hook seguro para obtener el userId desde localStorage o sesión
export function useUserId() {
  const [userId, setUserId] = useState<string | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Primero intentar obtener de la sesión (más confiable)
      if (session?.drupal?.user?.uid) {
        setUserId(session.drupal.user.uid);
        // También guardar en localStorage para compatibilidad
        try {
          localStorage.setItem("cofrem.user", JSON.stringify(session.drupal.user));
        } catch (error) {
          console.error("Error guardando usuario en localStorage:", error);
        }
        return;
      }

      // Si no hay en sesión, intentar desde localStorage
      try {
        const stored = localStorage.getItem("cofrem.user");
        if (stored) {
          const parsed = JSON.parse(stored);
          setUserId(parsed?.uid || null);
        }
      } catch (error) {
        console.error("Error leyendo localStorage:", error);
      }
    }
  }, [session]);

  return userId;
}

export function ProfileHeader() {
  const userId = useUserId();

  if (!userId) {
    return (
      <div className="flex items-center justify-between">
        <ProfileBreadcrumb />
        <Button variant="outline" size="sm" disabled>
          <Edit className="h-4 w-4" />
          Editar perfil
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <ProfileBreadcrumb />
    </div>
  );
}
