"use client";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { AlertCircle, CheckCircle, Clock, FileText } from "lucide-react";
import { usePqrsQuery } from "@/queries/pqrs";
import { Skeleton } from "@/components/ui/skeleton";

export function StatsCards() {
  const { data, isLoading, isError } = usePqrsQuery();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError || !data?.pqrs) {
    return (
      <p className="text-center text-muted-foreground mt-4">
        Error al cargar las estadísticas
      </p>
    );
  }

  // 📊 Calcular estadísticas desde data.pqrs
  const total = data.pqrs.length;
  const enProceso = data.pqrs.filter(
    (pqr: any) =>
      pqr.estado === "En trámite" ||
      pqr.estado === "En revisión" ||
      pqr.estado === "En gestión"
  ).length;
  const resueltas = data.pqrs.filter(
    (pqr: any) => pqr.estado === "Resuelto"
  ).length;
  const pendientes = total - (enProceso + resueltas);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {/* Total */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total PQRs
              </p>
              <p className="text-2xl text-primary">{total}</p>
            </div>
            <FileText className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      {/* En Proceso */}
      <Card className="border-l-4 border-l-yellow-500">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                En Proceso
              </p>
              <p className="text-2xl text-yellow-700">{enProceso}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </CardContent>
      </Card>

      {/* Resueltas */}
      <Card className="border-l-4 border-l-green-500">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Resueltas
              </p>
              <p className="text-2xl text-green-700">{resueltas}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      {/* Pendientes */}
      <Card className="border-l-4 border-l-orange-500">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Pendientes
              </p>
              <p className="text-2xl text-orange-700">{pendientes}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
