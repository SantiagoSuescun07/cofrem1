"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minuto
            retry: (failureCount, error: any) => {
              // No reintentar si es un error 401 o 403 (no autorizado)
              if (error?.response?.status === 401 || error?.response?.status === 403) {
                return false;
              }
              // Reintentar hasta 1 vez para otros errores
              return failureCount < 1;
            },
          },
        },
      })
  );

  useEffect(() => {
    // Escuchar el evento personalizado para limpiar queries cuando expire la sesión
    const handleClearQueries = () => {
      queryClient.clear();
    };

    window.addEventListener("cofrem:clear-queries", handleClearQueries);

    return () => {
      window.removeEventListener("cofrem:clear-queries", handleClearQueries);
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
