import { handlers } from "@/auth"

// Configurar runtime y timeout para evitar problemas en producción
export const runtime = "nodejs";
export const maxDuration = 30; // 30 segundos máximo

export const { GET, POST } = handlers