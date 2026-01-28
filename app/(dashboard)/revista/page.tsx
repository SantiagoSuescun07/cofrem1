"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, ExternalLink } from "lucide-react";
import Image from "next/image";
import api from "@/lib/axios";
import { ProgressBar } from "@/components/common/progress-bar";
import { normalizeImageUrl } from "@/lib/image-url-normalizer";
import { MagazinesSkeleton } from "@/components/common/magazines-skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// --------------------
// 🔹 Tipos de datos
// --------------------
interface FileData {
  id: string;
  attributes: {
    filename: string;
    uri: {
      url: string;
    };
  };
}

interface MagazineData {
  id: string;
  attributes: {
    title: string;
    field_edition_number: number;
    field_publish_date: string;
    field_any_link: {
      uri: string;
      title: string;
    };
  };
  relationships?: {
    field_image?: {
      links?: {
        related?: {
          href: string;
        };
      };
    };
  };
}

interface MagazineResponse {
  data: MagazineData[];
}

// 🔹 Tipo extendido con imagen cargada
export interface MagazineWithImage extends MagazineData {
  image: {
    filename: string;
    url: string;
  };
}

async function fetchMagazines(): Promise<MagazineWithImage[]> {
  const response = await api.get<MagazineResponse>(
    "/jsonapi/node/magazine_link",
    {
      headers: { "Content-Type": "application/json" },
      params: {
        "filter[status]": "1", // 🔹 solo revistas activas
        sort: "-created",      // 🔹 orden descendente (más recientes primero)
      },
    }
  );

  const magazines = response.data.data;

  // Para cada revista, obtener la imagen relacionada
  const withImages: MagazineWithImage[] = await Promise.all(
    magazines.map(async (mag) => {
      const imageHref = mag.relationships?.field_image?.links?.related?.href;
      let filename = "";
      let imageUrl = "";

      if (imageHref) {
        try {
          const imgResponse = await api.get(imageHref);
          const fileData = imgResponse.data?.data as FileData;
          filename = fileData?.attributes?.filename || "";
          
          // Verificar que tenemos la URL del archivo
          const uriUrl = fileData?.attributes?.uri?.url;
          if (uriUrl) {
            // Normalizar la URL
            imageUrl = normalizeImageUrl("https://backoffice.cofrem.com.co/", uriUrl);
          } else {
            console.warn(`[Revista] No se encontró URI para la imagen de la revista ${mag.attributes.title}`);
            filename = "Sin imagen";
          }
        } catch (err) {
          console.error(`[Revista] Error cargando imagen para ${mag.attributes.title}:`, err);
          filename = "Sin imagen";
        }
      } else {
        console.warn(`[Revista] No hay imageHref para la revista ${mag.attributes.title}`);
      }

      return {
        ...mag,
        image: { filename, url: imageUrl },
      };
    })
  );

  return withImages;
}


// --------------------
// 🔹 Página principal
// --------------------
export default function MagazinesPage() {
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [selectedMagazineTitle, setSelectedMagazineTitle] = useState<string>("");

  const { data, isLoading, isError } = useQuery<MagazineWithImage[], Error>({
    queryKey: ["magazines"],
    queryFn: fetchMagazines,
  });

  const magazines = (data ?? []).slice(0, 12);

  const handleOpenPdf = (pdfUrl: string, title: string) => {
    setSelectedPdfUrl(pdfUrl);
    setSelectedMagazineTitle(title);
  };

  const handleClosePdf = () => {
    setSelectedPdfUrl(null);
    setSelectedMagazineTitle("");
  };

  const handleOpenInNewWindow = () => {
    if (selectedPdfUrl) {
      window.open(selectedPdfUrl, "_blank", "noopener,noreferrer");
    }
  };

  if (isLoading) {
    return <MagazinesSkeleton />;
  }


  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 md:px-10 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <span>Inicio</span>
            <span>/</span>
            <span className="text-foreground font-medium flex justify-center items-center gap-3">
              Revista Enlace {" "}
              <div className="flex justify-center items-center">
                <ProgressBar />
              </div>
            </span>
          </div>
          <div className="h-1 w-24 bg-blue-500 rounded-full" />
        </div>

        {/* Error */}
        {isError && (
          <div className="text-center py-12">
            <p className="text-destructive">
              Error al cargar las revistas. Por favor, intenta de nuevo.
            </p>
          </div>
        )}

        {/* Loading */}
        {/* {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        )} */}

        {/* Grid de revistas */}
        {!isLoading && magazines.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {magazines.map((magazine) => (
              <Card
                key={magazine.id}
                className="overflow-hidden hover:shadow-lg transition-shadow p-0"
              >
                <CardContent className="p-0">
                  {/* Imagen */}
                  {magazine.image.url ? (
                    <div className="w-full h-[200px] sm:h-[240px] md:h-[280px] lg:h-[320px] bg-gray-100 flex items-center justify-center overflow-hidden">
                      <Image
                        src={magazine.image.url}
                        alt={magazine.image.filename || magazine.attributes.title}
                        width={300}
                        height={200}
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-contain w-full h-full"
                        style={{ objectFit: "contain" }}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[200px] sm:h-[240px] md:h-[280px] lg:h-[320px] text-muted-foreground text-sm bg-gray-100">
                      Sin imagen
                    </div>
                  )}

                  {/* Información */}
                  <div className="p-4">
                    <h3 className="text-base font-medium mb-2 line-clamp-2">
                      {magazine.attributes.title}
                    </h3>

                    <Button
                      variant="ghost"
                      className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 p-0 h-auto font-normal text-sm group"
                      onClick={() =>
                        handleOpenPdf(
                          magazine.attributes.field_any_link.uri,
                          magazine.attributes.title
                        )
                      }
                    >
                      Ver revista
                      <ArrowRight className="ml-2 h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Sin resultados */}
        {!isLoading && magazines.length === 0 && !isError && (
          <div className="text-center py-12 text-muted-foreground">
            No se encontraron revistas.
          </div>
        )}
      </div>

      {/* Modal para mostrar el PDF */}
      <Dialog open={!!selectedPdfUrl} onOpenChange={handleClosePdf}>
        <DialogContent className="max-w-6xl max-h-[90vh] w-[95vw] p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between gap-4">
              <DialogTitle className="text-xl font-semibold flex-1">
                {selectedMagazineTitle}
              </DialogTitle>
              <Button
                onClick={handleOpenInNewWindow}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir
              </Button>
            </div>
          </DialogHeader>
          <div className="relative w-full h-[calc(90vh-100px)]">
            {selectedPdfUrl && (
              <iframe
                src={selectedPdfUrl}
                className="w-full h-full border-0"
                title={selectedMagazineTitle}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
