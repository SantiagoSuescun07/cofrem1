import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { auth } from "@/auth";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import QueryProvider from "@/components/providers/query-provider";
import localFont from "next/font/local";
import { FloatingChat } from "@/components/common/floating-chat";
import { SessionGuard } from "@/components/common/session-guard";

// === Humms777 BT ===
const humms777 = localFont({
  src: [
    {
      path: "../fonts/humnst777/Humnst777 BT Roman.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/humnst777/HUM777K.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-humms777",
  display: "swap",
});

// === Colvetica (Coolvetica) ===
const colvetica = localFont({
  src: [
    {
      path: "../fonts/coolvetica/coolvetica-rg.otf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-colvetica",
  display: "swap",
});

// === Fuentes Google (ya existentes) ===
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cofrem Intranet",
  description: "Interfaz con fuentes corporativas Humms777 BT y Colvetica",
  icons: {
    icon: [{ url: "/favicon.ico" }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  // No redirigir aquí - el middleware ya maneja las redirecciones
  // Si la sesión es null, el middleware redirigirá al login
  // Esto evita bucles infinitos cuando estamos en rutas de auth

  return (
    <html lang="es">
      <body
        className={`
          ${geistSans.variable}
          ${geistMono.variable}
          ${humms777.variable}
          ${colvetica.variable}
          antialiased
        `}
      >
        <SessionProvider 
          session={session}
          refetchInterval={5 * 60} // Refrescar cada 5 minutos
          refetchOnWindowFocus={false} // No refrescar al cambiar de pestaña
          refetchWhenOffline={false} // No refrescar cuando está offline
        >
          <SessionGuard />
          <Toaster richColors />
          <QueryProvider>{children}
            <FloatingChat />
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
