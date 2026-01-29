import { ACCESS_TOKEN, REFRESH_TOKEN, apiBaseUrl } from "@/constants";
import axios from "axios";
import { toast } from "sonner";
import { drupalTokenLog, maskToken } from "@/lib/drupal-token-logger";
import { getAccessToken, isExpired, clearToken } from "@/lib/token-manager";

const api = axios.create({
  baseURL: apiBaseUrl,
});

// Variable para controlar el refresh token en curso
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

// Función para procesar la cola de peticiones fallidas
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Interceptor de request
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      // Primero intentar obtener el token de localStorage
      let accessToken = localStorage.getItem(ACCESS_TOKEN);
      
      // Si no hay token en localStorage, intentar obtenerlo de la sesión de NextAuth
      // Esto es útil cuando las queries se ejecutan antes de que el layout sincronice el token
      if (!accessToken) {
        try {
          // Intentar obtener el token desde sessionStorage (si está disponible)
          // o desde el evento de sesión
          const sessionData = sessionStorage.getItem("nextauth.session");
          if (sessionData) {
            // El token debería estar en localStorage después de que SessionGuard lo guarde
            // Pero si no está, esperamos a que se sincronice
            accessToken = localStorage.getItem(ACCESS_TOKEN);
          }
        } catch (e) {
          // Ignorar errores al acceder a sessionStorage
        }
      }

      config.headers = config.headers ?? {};

      // Headers anti-caché para evitar que el navegador cachee respuestas
      config.headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
      config.headers["Pragma"] = "no-cache";
      config.headers["Expires"] = "0";

      if (accessToken) {
        config.headers["Authorization"] = `Bearer ${accessToken}`;
      } else {
        // Si no hay token, loguear un warning pero no bloquear la petición
        // El servidor devolverá 401 y el interceptor de respuesta lo manejará
        console.warn("⚠️ No hay access token disponible para la petición:", config.url);
      }

      // Añadir timestamp a peticiones GET para evitar caché basado en URL
      if (config.method === "get" || config.method === "GET") {
        config.params = config.params ?? {};
        // Solo añadir timestamp si no existe ya (para permitir override)
        if (!config.params.t && !config.params._t) {
          config.params.t = Date.now();
        }
      }

      if (drupalTokenLog.isEnabled()) {
        const fullUrl = (config.baseURL ?? "") + (config.url ?? "");
        const rawExp = localStorage.getItem("cofrem.expires_at");
        const expAt = rawExp ? Number(rawExp) : null;
        drupalTokenLog.request({
          method: (config.method ?? "get").toUpperCase(),
          url: fullUrl,
          tokenUsed: accessToken ?? null,
          tokenExpiresAt: expAt,
          tokenExpired: isExpired(),
        });
      }
    }

    return config;
  },
  (error) => {
    console.error("❌ Error en request interceptor:", error);
    return Promise.reject(error);
  }
);

// Interceptor de respuesta
api.interceptors.response.use(
  (response) => {
    if (typeof window !== "undefined" && drupalTokenLog.isEnabled()) {
      const fullUrl = (response.config.baseURL ?? "") + (response.config.url ?? "");
      drupalTokenLog.response({
        url: fullUrl,
        status: response.status,
        statusText: response.statusText,
      });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Si es un error 401 o 403 y aún no hemos intentado refrescar el token
    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      // Verificar si ya estamos en proceso de logout para evitar bucles
      if (typeof window !== "undefined") {
        const isLoggingOut = sessionStorage.getItem("cofrem.logging_out");
        if (isLoggingOut === "true") {
          return Promise.reject(error);
        }
      }

      // Si ya hay un refresh en curso, agregar esta petición a la cola
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Obtener el refresh_token del localStorage
        const refreshToken = typeof window !== "undefined" 
          ? localStorage.getItem(REFRESH_TOKEN)
          : null;

        if (!refreshToken) {
          throw new Error("No hay refresh_token disponible");
        }

        // Llamar directamente al endpoint de Drupal para refrescar el token
        const refreshUrl = apiBaseUrl.endsWith('/') 
          ? `${apiBaseUrl}api/auth/refresh`
          : `${apiBaseUrl}/api/auth/refresh`;

        const rawExp = typeof window !== "undefined" ? localStorage.getItem("cofrem.expires_at") : null;
        const expAt = rawExp ? Number(rawExp) : null;
        const accessTokenUsed = typeof window !== "undefined" ? localStorage.getItem(ACCESS_TOKEN) : null;

        drupalTokenLog.error({
          context: "axios 401 – petición que disparó refresh",
          url: (originalRequest.baseURL ?? "") + (originalRequest.url ?? ""),
          status: error.response?.status,
          tokenUsed: accessTokenUsed,
          tokenExpired: typeof window !== "undefined" ? isExpired() : false,
        });
        drupalTokenLog.refresh({ phase: "intent", refreshTokenMasked: maskToken(refreshToken) });
        drupalTokenLog.request({
          method: "POST",
          url: refreshUrl,
          tokenUsed: refreshToken,
          tokenExpiresAt: expAt,
          tokenExpired: typeof window !== "undefined" ? isExpired() : false,
          body: { refresh_token: refreshToken },
          alwaysLog: true,
        });

        const refreshResponse = await axios.post(
          refreshUrl,
          { refresh_token: refreshToken },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        
        if (refreshResponse.data?.access_token) {
          const newAccessToken = refreshResponse.data.access_token;
          const newRefreshToken = refreshResponse.data.refresh_token || refreshToken;
          const expiresIn = refreshResponse.data.expires_in || 3600;
          const expiresAt = Date.now() + expiresIn * 1000;

          drupalTokenLog.response({
            url: refreshUrl,
            status: refreshResponse.status,
            tokenReceived: newAccessToken,
            expiresIn,
          });
          drupalTokenLog.refresh({
            phase: "success",
            newAccessTokenMasked: maskToken(newAccessToken),
            expiresAt,
          });

          // Actualizar los tokens en localStorage
          if (typeof window !== "undefined") {
            localStorage.setItem(ACCESS_TOKEN, newAccessToken);
            localStorage.setItem(REFRESH_TOKEN, newRefreshToken);
            localStorage.setItem("cofrem.expires_at", String(expiresAt));
          }
          
          // Actualizar el header de autorización para la petición original
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          
          // Procesar la cola de peticiones pendientes
          processQueue(null, newAccessToken);
          isRefreshing = false;
          
          // Reintentar la petición original
          return api(originalRequest);
        } else {
          throw new Error("No se recibió access_token en la respuesta");
        }
      } catch (refreshError: any) {
        const ax = refreshError?.response;
        drupalTokenLog.error({
          context: "axios refresh token (client)",
          url: apiBaseUrl.endsWith("/") ? `${apiBaseUrl}api/auth/refresh` : `${apiBaseUrl}/api/auth/refresh`,
          status: ax?.status,
          message: refreshError?.message,
          tokenUsed: typeof window !== "undefined" ? localStorage.getItem(REFRESH_TOKEN) : null,
          tokenExpired: typeof window !== "undefined" ? isExpired() : false,
          err: refreshError,
        });
        drupalTokenLog.refresh({
          phase: "fail",
          refreshTokenMasked: typeof window !== "undefined" ? maskToken(localStorage.getItem(REFRESH_TOKEN)) : "(ninguno)",
          reason: ax?.status === 401 ? "401 Unauthorized (refresh_token inválido o expirado)" : refreshError?.message,
        });
        // Si el refresh falla, limpiar el token y redirigir al login
        console.error("❌ Error al refrescar token:", refreshError);

        // Procesar la cola con el error
        processQueue(refreshError, null);
        isRefreshing = false;
        
        if (typeof window !== "undefined") {
          // Marcar que estamos en proceso de logout para evitar bucles
          sessionStorage.setItem("cofrem.logging_out", "true");
          
          // Limpiar todos los tokens y datos de autenticación
          clearToken();
          
          // Limpiar el flag después de un tiempo
          setTimeout(() => {
            sessionStorage.removeItem("cofrem.logging_out");
          }, 5000);
          
          // Solo redirigir si no estamos ya en la página de login
          if (!window.location.pathname.startsWith("/auth/login")) {
            // Verificar si el cierre fue por inactividad
            const logoutReason = sessionStorage.getItem("cofrem.logout_reason");
            
            if (logoutReason === "inactivity") {
              toast.error("Tu sesión se ha cerrado por inactividad. Por favor, inicia sesión nuevamente.");
            } else {
              toast.info("Tu sesión ha expirado. Inicia sesión nuevamente.");
            }
            
            // Guardar la URL actual para redirigir después del login
            const currentUrl = window.location.pathname + window.location.search;
            const callbackUrl = encodeURIComponent(currentUrl);
            const reasonParam = logoutReason === "inactivity" ? "&reason=inactivity" : "";
            
            // Limpiar el flag después de usarlo
            if (logoutReason) {
              sessionStorage.removeItem("cofrem.logout_reason");
            }
            
            window.location.href = `/auth/login?callbackUrl=${callbackUrl}${reasonParam}`;
          }
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
