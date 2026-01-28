/**
 * Logger de depuración para peticiones y tokens de Drupal.
 * Permite ver qué peticiones se hacen, con qué token, y qué responde Drupal.
 *
 * Activar con: DRUPAL_TOKEN_DEBUG=1 (server) o NEXT_PUBLIC_DRUPAL_TOKEN_DEBUG=1 (client)
 * En desarrollo (server): se activa automáticamente con NODE_ENV=development
 */

const PREFIX = "[DRUPAL-TOKEN]";

function isEnabled(): boolean {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_DRUPAL_TOKEN_DEBUG === "1";
  }
  return process.env.DRUPAL_TOKEN_DEBUG === "1" || process.env.NODE_ENV === "development";
}

/** Muestra los primeros y últimos caracteres del token, sin exponerlo completo. */
export function maskToken(token: string | null | undefined): string {
  if (!token || typeof token !== "string") return "(ninguno)";
  if (token.length <= 16) return `${token.slice(0, 4)}...`;
  return `${token.slice(0, 8)}...${token.slice(-4)}`;
}

/** Formato de timestamp para los logs. */
function ts(): string {
  return new Date().toISOString();
}

function log(level: "log" | "warn" | "error", ...args: unknown[]) {
  if (!isEnabled() && level !== "error") return;
  const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  fn(`${PREFIX} ${ts()}`, ...args);
}

export const drupalTokenLog = {
  /** Petición saliente a Drupal (API o refresh). */
  request(args: {
    method: string;
    url: string;
    tokenUsed?: string | null;
    tokenExpiresAt?: number | null;
    tokenExpired?: boolean;
    body?: Record<string, unknown>;
    /** Si true, siempre registra (p. ej. refresh) aunque debug esté desactivado. */
    alwaysLog?: boolean;
  }) {
    const doLog = args.alwaysLog || isEnabled();
    if (!doLog) return;
    const out = {
      method: args.method,
      url: args.url,
      token: maskToken(args.tokenUsed ?? undefined),
      tokenExpira: args.tokenExpiresAt
        ? new Date(args.tokenExpiresAt).toISOString()
        : "(desconocido)",
      tokenExpirado: args.tokenExpired ?? null,
      body: args.body
        ? {
            ...args.body,
            refresh_token: args.body.refresh_token
              ? `(${maskToken(String(args.body.refresh_token))})`
              : undefined,
          }
        : undefined,
    };
    if (args.alwaysLog) {
      console.log(`${PREFIX} ${ts()}`, "→ PETICIÓN", out);
    } else {
      log("log", "→ PETICIÓN", out);
    }
  },

  /** Respuesta recibida de Drupal. */
  response(args: {
    url: string;
    status: number;
    statusText?: string;
    data?: unknown;
    tokenReceived?: string | null;
    expiresIn?: number;
  }) {
    log("log", "← RESPUESTA", {
      url: args.url,
      status: args.status,
      statusText: args.statusText,
      token: args.tokenReceived != null ? maskToken(String(args.tokenReceived)) : undefined,
      expiresIn: args.expiresIn,
      data: args.data,
    });
  },

  /** Error en petición a Drupal (incl. 401). */
  error(args: {
    context: string;
    url?: string;
    status?: number;
    message?: string;
    tokenUsed?: string | null;
    tokenExpired?: boolean;
    err?: unknown;
  }) {
    log("error", "❌ ERROR", {
      context: args.context,
      url: args.url,
      status: args.status,
      message: args.message,
      token: maskToken(args.tokenUsed ?? undefined),
      tokenExpirado: args.tokenExpired ?? null,
      error: args.err instanceof Error ? args.err.message : args.err,
    });
  },

  /** Refresh de token (intento, éxito o fallo). */
  refresh(args: {
    phase: "intent" | "success" | "fail";
    refreshTokenMasked?: string;
    newAccessTokenMasked?: string;
    expiresAt?: number;
    reason?: string;
  }) {
    if (args.phase === "fail") {
      log("error", "🔄 REFRESH FAIL", args);
    } else {
      log("log", "🔄 REFRESH", args);
    }
  },

  /** Decisión en JWT: expiración, ventana de refresh, etc. */
  jwt(args: {
    drupalExpiresAt?: number | null;
    now: number;
    inRefreshWindow: boolean;
    expired: boolean;
    hasRefreshToken: boolean;
    action?: string;
  }) {
    log("log", "JWT", {
      ...args,
      drupalExpiresAt: args.drupalExpiresAt
        ? new Date(args.drupalExpiresAt).toISOString()
        : "(desconocido)",
      now: new Date(args.now).toISOString(),
    });
  },

  /** Comprobar si el logger está activo (para mostrar en UI o docs). */
  isEnabled,
};
