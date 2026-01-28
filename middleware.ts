import authConfig from "./auth.config";
import NextAuth from "next-auth";
import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
} from "@/routes";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  // Verificar si hay un usuario válido (no solo si req.auth existe, sino si tiene user)
  const isLoggedIn = !!req.auth && !!req.auth.user;

  // console.log("Auth:", req.auth)

  // console.log('Middleware ejecutándose:', {
  //   pathname: nextUrl.pathname,
  //   isLoggedIn,
  //   isPublicRoute: publicRoutes.includes(nextUrl.pathname),
  //   isAuthRoute: authRoutes.includes(nextUrl.pathname)
  // });

  const isApiRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);

  // Permitir todas las rutas de API de auth
  if (isApiRoute) {
    return null;
  }

  // Si está en ruta de auth y ya está logueado, redirigir al dashboard o callbackUrl
  if (isAuthRoute) {
    if (isLoggedIn) {
      // Si hay un callbackUrl, redirigir ahí, sino al default
      const callbackUrl = nextUrl.searchParams.get("callbackUrl");
      const redirectUrl = callbackUrl 
        ? decodeURIComponent(callbackUrl)
        : DEFAULT_LOGIN_REDIRECT;
      return Response.redirect(new URL(redirectUrl, nextUrl));
    }
    return null; // Permitir acceso a rutas de auth si no está logueado
  }

  // Si no está logueado y la ruta no es pública, redirigir a login
  // Evitar bucles infinitos: si ya estamos en la ruta de login, no redirigir de nuevo
  if (!isLoggedIn && !isPublicRoute && !isAuthRoute) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }
    
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    return Response.redirect(new URL(`/auth/login?callbackUrl=${encodedCallbackUrl}`, nextUrl));
  }

  return null;
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};