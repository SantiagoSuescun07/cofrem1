"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Icons } from "@/components/ui/icons";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

export default function LoginPage() {
  const [error, setError] = useState<string>("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const rawCallbackUrl = searchParams?.get("callbackUrl");
    const errorParam = searchParams?.get("error");
    const reasonParam = searchParams?.get("reason");

    // Manejar cierre de sesión por inactividad
    if (reasonParam === "inactivity") {
      toast.error("Tu sesión se ha cerrado por inactividad. Por favor, inicia sesión nuevamente.", {
        duration: 6000,
      });
      // Limpiar el flag de sessionStorage
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("cofrem.logout_reason");
      }
    }

    // Manejo de errores de OAuth
    if (errorParam) {
      switch (errorParam) {
        case "OAuthAccountNotLinked":
          toast.error(
            "Esta cuenta ya está vinculada con otro método de inicio de sesión."
          );
          break;
        case "AccessDenied":
          toast.error("No tienes permisos para acceder a esta sección.");
          break;
        case "Configuration":
          toast.error("Error de configuración. Contacta al administrador.");
          break;
        default:
          toast.error("Ocurrió un error durante el inicio de sesión.");
      }
    }

    // Verificar callback URL con error AccessDenied
    if (rawCallbackUrl) {
      const decoded = decodeURIComponent(rawCallbackUrl);
      const urlParams = new URLSearchParams(decoded.split("?")[1]);
      const callbackError = urlParams.get("error");

      if (callbackError === "AccessDenied") {
        toast.error("No tienes permisos para acceder a esta sección.");
      }
    }
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    setError("");
    setIsGoogleLoading(true);

    try {
      // Obtener el callbackUrl de los query params, o usar el default
      const rawCallbackUrl = searchParams?.get("callbackUrl");
      const callbackUrl = rawCallbackUrl 
        ? decodeURIComponent(rawCallbackUrl)
        : DEFAULT_LOGIN_REDIRECT;

      await signIn("google", {
        callbackUrl: callbackUrl,
      });
    } catch (error) {
      console.error("Error al iniciar sesión con Google:", error);
      setError(
        "No se pudo iniciar sesión con Google. Por favor, intenta nuevamente."
      );
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen grid grid-cols-1">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
        radial-gradient(125% 125% at 50% 10%, #ffffff 40%, #10b981 100%)
      `,
          backgroundSize: "100% 100%",
        }}
      />

      {/* Panel de Login */}
      <div className="flex flex-col justify-center items-center p-6 md:p-12 lg:p-16 z-50">
        <div className="w-full max-w-md space-y-8">
          <Card className="border-0 shadow-2xl">
            <CardHeader className="space-y-2 text-center pb-8">
              <Image src="/icons/logo_cofrem.svg" alt="Logo Cofrem" width={300} height={150} className="mx-auto mb-10 h-14 w-auto object-contain" />

              <CardTitle className="text-3xl font-semibold tracking-tight">
                Bienvenido
              </CardTitle>
              <CardDescription className="text-base">
                Inicia sesión para continuar con tu cuenta
              </CardDescription>
            </CardHeader>

            <CardContent className="">
              {/* Mensaje de error */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Botón de Google */}
              <Button
                variant="outline"
                type="button"
                size="lg"
                className="w-full h-12 text-base hover:bg-accent hover:scale-[1.02] transition-all duration-200"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <>
                    <Icons.spinner className="h-5 w-5 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <Icons.google className="size-6" />
                    Continuar con Google
                  </>
                )}
              </Button>


            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}