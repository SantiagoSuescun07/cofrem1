import { useEffect, useState } from "react";
import { ACCESS_TOKEN } from "@/constants";
import { useSession } from "next-auth/react";

/**
 * Hook para verificar si hay un token de acceso disponible
 * Reacciona a cambios tanto en localStorage como en la sesión
 */
export function useHasToken() {
  const [hasToken, setHasToken] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkToken = () => {
      // Si la sesión está invalidada o no hay usuario, no hay token válido
      if (status === "unauthenticated" || !session?.user || !session?.drupal?.accessToken) {
        setHasToken(false);
        return;
      }

      // Verificar localStorage
      const token = localStorage.getItem(ACCESS_TOKEN);
      
      // Si hay token en la sesión pero no en localStorage, esperar a que se sincronice
      if (!token && session?.drupal?.accessToken) {
        // El layout debería sincronizar el token, pero esperamos un poco
        setTimeout(() => {
          const syncedToken = localStorage.getItem(ACCESS_TOKEN);
          setHasToken(!!syncedToken);
        }, 100);
      } else {
        setHasToken(!!token);
      }
    };

    // Verificar inmediatamente
    checkToken();

    // Escuchar cambios en localStorage (de otras pestañas o del mismo componente)
    const handleStorageChange = () => {
      checkToken();
    };
    
    window.addEventListener("storage", handleStorageChange);
    
    // También verificar periódicamente (por si el cambio fue en la misma ventana)
    const interval = setInterval(checkToken, 500);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [session, status]);

  return hasToken;
}
