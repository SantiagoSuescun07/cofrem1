import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePqrsQuery } from "@/queries/pqrs";
import { AlertCircle, CheckCircle, Clock, FileText } from "lucide-react";
import React from "react";

const getStatusIcon = (estado: string) => {
  switch (estado) {
    case "Radicado":
      return <FileText className="h-4 w-4" />;
    case "En revisión":
    case "En trámite":
      return <Clock className="h-4 w-4" />;
    case "En gestión":
      return <AlertCircle className="h-4 w-4" />;
    case "Resuelto":
      return <CheckCircle className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getStatusColor = (estado: string) => {
  switch (estado) {
    case "Radicado":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "En revisión":
    case "En trámite":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "En gestión":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "Resuelto":
      return "bg-green-50 text-green-700 border-green-200";
    case "Reabierto":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

const PqrsSkeleton = () => {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <Skeleton className="h-5 w-16 rounded-md" />
          <Skeleton className="h-5 w-20 rounded-md" />
          <Skeleton className="h-5 w-24 rounded-md" />
        </div>
        <Skeleton className="h-5 w-48 mb-2 rounded-md" />
        <Skeleton className="h-4 w-64 mb-2 rounded-md" />
        <Skeleton className="h-4 w-40 rounded-md" />
      </div>
      <Skeleton className="h-8 w-24 rounded-md" />
    </div>
  );
};

export function PQRList() {
  const { data, isLoading, isError } = usePqrsQuery();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mis PQRs</CardTitle>
          <CardDescription>
            Lista de todas tus peticiones, quejas y reclamos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* mostramos varios skeletons para simular varias filas */}
          {Array.from({ length: 4 }).map((_, i) => (
            <PqrsSkeleton key={i} />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-red-600">
          Error al cargar las PQRs. Intenta nuevamente.
        </CardContent>
      </Card>
    );
  }

  if (!data?.pqrs?.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No tienes PQRs registradas todavía.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mis PQRs</CardTitle>
        <CardDescription>
          Lista de todas tus peticiones, quejas y reclamos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.pqrs.map((pqr) => (
            <div
              key={pqr.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Badge
                    variant="outline"
                    className="font-mono border-primary text-primary"
                  >
                    #{pqr.id}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-secondary text-secondary-foreground"
                  >
                    {pqr.tipo}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={getStatusColor(pqr.estado)}
                  >
                    <div className="flex items-center gap-1">
                      {getStatusIcon(pqr.estado)}
                      {pqr.estado}
                    </div>
                  </Badge>
                </div>
                <h3 className="font-normal text-lg mb-1 text-foreground">
                  {pqr.asunto}
                </h3>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Fecha radicación: {pqr.fecha_radicacion}</span>
                </div>
              </div>
              {/* <Button
                variant="outline"
                size="sm"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
              >
                Ver Detalles
              </Button> */}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
