"use client";

import { useEffect, useRef, useCallback } from "react";
import { signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { clearToken } from "@/lib/token-manager";

interface UseInactivityDetectorOptions {
  /**
   * Tiempo de inactividad en milisegundos antes de cerrar sesión
   * Por defecto: 30 minutos (1800000 ms)
   */
  inactivityTimeout?: number;
  /**
   * Tiempo de advertencia antes de cerrar sesión (en milisegundos)
   * Por defecto: 5 minutos antes (300000 ms)
   */
  warningTimeout?: number;
  /**
   * Si debe mostrar advertencia antes de cerrar sesión
   * Por defecto: true
   */
  showWarning?: boolean;
}

/**
 * Hook para detectar inactividad del usuario y cerrar sesión automáticamente
 */
export function useInactivityDetector(options: UseInactivityDetectorOptions = {}) {
  const {
    inactivityTimeout = 30 * 60 * 1000, // 30 minutos por defecto
    warningTimeout = 5 * 60 * 1000, // 5 minutos antes de cerrar
    showWarning = true,
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const warningShownRef = useRef<boolean>(false);

  // Función para resetear el timer de inactividad
  const resetInactivityTimer = useCallback(() => {
    // Limpiar timers existentes
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }

    // Actualizar última actividad
    lastActivityRef.current = Date.now();
    warningShownRef.current = false;

    // No configurar timer si estamos en una ruta de autenticación
    const isAuthRoute = pathname?.startsWith("/auth");
    if (isAuthRoute) {
      return;
    }

    // Configurar timer de advertencia
    if (showWarning) {
      const warningTime = inactivityTimeout - warningTimeout;
      warningTimeoutRef.current = setTimeout(() => {
        if (!warningShownRef.current) {
          warningShownRef.current = true;
          toast.warning(
            `Tu sesión se cerrará por inactividad en ${Math.floor(warningTimeout / 60000)} minutos.`,
            {
              duration: 10000,
            }
          );
        }
      }, warningTime);
    }

    // Configurar timer de cierre de sesión
    timeoutRef.current = setTimeout(() => {
      // Marcar que el cierre fue por inactividad
      if (typeof window !== "undefined") {
        sessionStorage.setItem("cofrem.logout_reason", "inactivity");
      }

      // Limpiar todos los datos de autenticación antes de cerrar sesión
      clearToken();

      // Cerrar sesión y redirigir al login
      // El mensaje se mostrará en la página de login o en el interceptor de axios
      const currentPath = pathname || "/";
      const callbackUrl = encodeURIComponent(currentPath);
      
      signOut({
        callbackUrl: `/auth/login?callbackUrl=${callbackUrl}&reason=inactivity`,
        redirect: true,
      });
    }, inactivityTimeout);
  }, [inactivityTimeout, warningTimeout, showWarning, pathname]);

  // Detectar actividad del usuario
  useEffect(() => {
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    const handleActivity = () => {
      // Solo resetear si ha pasado al menos 1 segundo desde la última actividad
      // para evitar resetear demasiado frecuentemente
      const now = Date.now();
      if (now - lastActivityRef.current > 1000) {
        resetInactivityTimer();
      }
    };

    // Agregar listeners de eventos
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Inicializar el timer
    resetInactivityTimer();

    // Cleanup
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [resetInactivityTimer]);

  // Resetear timer cuando cambia la ruta (navegación)
  useEffect(() => {
    resetInactivityTimer();
  }, [pathname, resetInactivityTimer]);

  return {
    resetTimer: resetInactivityTimer,
    lastActivity: lastActivityRef.current,
  };
}

