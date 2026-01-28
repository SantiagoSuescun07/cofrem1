import React, { useState } from "react";
import { ProgressBar } from "./progress-bar";
import { useDigitalServicesQuery } from "@/queries/digital-services";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

export const QuickAccessGrid = () => {
  const { data: quickAccessData, isLoading, isError } = useDigitalServicesQuery();
  console.log("quickAccessData: ", quickAccessData);
  const router = useRouter();

  const [showAll, setShowAll] = useState(false);

  // Mostrar solo 8 si no se ha presionado "Ver más"
  const displayedServices = showAll
    ? quickAccessData
    : quickAccessData?.slice(0, 8);

  // Skeleton mientras carga, si hay error o si no hay datos
  if (isLoading || isError || !quickAccessData?.length) {
    return (
      <div className="mt-20 text-center">
        <h2 className="flex items-center gap-3 text-xl text-[#323c45] mb-6">
          Servicios en línea <ProgressBar />
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 justify-items-center">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-between bg-white p-4 rounded-lg border border-gray-200 w-full max-w-[180px] h-[140px]"
            >
              <Skeleton className="w-12 h-12 rounded-lg mb-3" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-20 text-center">
      <h2 className="flex items-center gap-3 text-xl text-[#323c45] mb-6">
        Servicios en línea <ProgressBar />
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 justify-items-center">
        {displayedServices?.map((access) => {
          // Si es un enlace interno (entity:node/X), usar navegación de Next.js
          const isInternalLink = access.isInternal && access.nodeId;
          
          if (isInternalLink) {
            const handleClick = (e: React.MouseEvent) => {
              e.preventDefault();
              const route = `/digital-services/${access.nodeId}`;
              console.log(`[QuickAccessGrid] Navegando a ruta interna: ${route}`);
              router.push(route);
            };

            return (
              <button
                key={access.id}
                onClick={handleClick}
                type="button"
                className="flex flex-col items-center justify-between group bg-white p-4 rounded-lg border border-gray-200 hover:border-[#306393] hover:shadow-md transition-all duration-200 w-full max-w-[180px] h-[140px] cursor-pointer"
              >
                {/* Contenedor fijo para iconos - siempre en la parte superior */}
                <div className="w-12 h-12 flex items-center justify-center flex-shrink-0 mb-3">
                  <Image
                    src={access.icon?.url ?? ""}
                    alt={access.title}
                    width={48}
                    height={48}
                    className="object-contain"
                    style={{ maxWidth: "48px", maxHeight: "48px", width: "auto", height: "auto" }}
                  />
                </div>
                {/* Contenedor fijo para texto - siempre en la parte inferior */}
                <span className="text-sm font-medium text-gray-700 text-center h-[48px] flex items-center justify-center leading-tight px-1">
                  {access.title}
                </span>
              </button>
            );
          }

          // Si es un enlace externo, usar Link
          return (
            <Link
              key={access.id}
              href={access.link}
              target={access.newTab ? "_blank" : "_self"}
              rel={access.newTab ? "noopener noreferrer" : undefined}
              className="flex flex-col items-center justify-between group bg-white p-4 rounded-lg border border-gray-200 hover:border-[#306393] hover:shadow-md transition-all duration-200 w-full max-w-[180px] h-[140px]"
            >
              {/* Contenedor fijo para iconos - siempre en la parte superior */}
              <div className="w-12 h-12 flex items-center justify-center flex-shrink-0 mb-3">
                <Image
                  src={access.icon?.url ?? ""}
                  alt={access.title}
                  width={48}
                  height={48}
                  className="object-contain"
                  style={{ maxWidth: "48px", maxHeight: "48px", width: "auto", height: "auto" }}
                />
              </div>
              {/* Contenedor fijo para texto - siempre en la parte inferior */}
              <span className="text-sm font-medium text-gray-700 text-center h-[48px] flex items-center justify-center leading-tight px-1">
                {access.title}
              </span>
            </Link>
          );
        })}
      </div>

      {quickAccessData && quickAccessData.length > 8 && (
        <button
          onClick={() => setShowAll((prev) => !prev)}
          className="mt-6 px-5 py-2 text-sm font-medium text-[#306393] hover:text-[#306393]/80 hover:underline transition-all"
        >
          {showAll ? "Ver menos" : "Ver más"}
        </button>
      )}
    </div>
  );
};
