import { ACCESS_TOKEN, REFRESH_TOKEN } from "@/constants";
const EXPIRES_AT_KEY = "cofrem.expires_at";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN);
}

export function isExpired(): boolean {
  if (typeof window === "undefined") return true;
  const raw = localStorage.getItem(EXPIRES_AT_KEY);
  if (!raw) return true;
  return Date.now() > Number(raw) - 30_000; // 30s de margen
}

/**
 * Limpia TODOS los datos relacionados con la autenticación
 * de localStorage y sessionStorage
 */
export function clearToken() {
  if (typeof window === "undefined") return;
  
  // Limpiar tokens principales
  localStorage.removeItem(ACCESS_TOKEN);
  localStorage.removeItem(REFRESH_TOKEN);
  localStorage.removeItem(EXPIRES_AT_KEY);
  
  // Limpiar otros datos relacionados con la autenticación
  localStorage.removeItem("cofrem.user");
  localStorage.removeItem("drupalAuthData");
  localStorage.removeItem("drupalAccessToken"); // Por si acaso queda alguno con el nombre antiguo
  
  // Limpiar sessionStorage
  sessionStorage.removeItem("cofrem.logging_out");
  sessionStorage.removeItem("cofrem.logout_reason");
  
  // Limpiar cache de React Query si está disponible
  try {
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent("cofrem:clear-queries"));
    }
  } catch (e) {
    console.warn("No se pudo limpiar queries de React Query:", e);
  }
  
  console.log("🧹 Todos los datos de autenticación han sido limpiados");
}
