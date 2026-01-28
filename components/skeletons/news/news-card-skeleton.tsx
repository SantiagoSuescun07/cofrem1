import { Skeleton } from "@/components/ui/skeleton";

export function NewsCardSkeleton() {
  return (
    <div className="relative flex flex-col sm:flex-row gap-4 w-full border rounded-2xl p-4 shadow-sm bg-white">
      {/* Imagen */}
      <div className="relative w-full sm:w-40 h-40 shrink-0 rounded-xl overflow-hidden">
        <Skeleton className="w-full h-full" />
      </div>

      {/* Contenido */}
      <div className="flex flex-col flex-1">
        {/* Fecha */}
        <div className="flex justify-end mb-2">
          <Skeleton className="h-3 w-24" />
        </div>

        {/* Título */}
        <Skeleton className="h-5 w-3/4 mb-2" />

        {/* Resumen */}
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* Footer */}
        <div className="flex justify-between mt-4 items-center">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-10" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}
