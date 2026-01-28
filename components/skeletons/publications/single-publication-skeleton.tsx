import { Skeleton } from "@/components/ui/skeleton";

export function SinglePublicationSkeleton() {
  return (
    <div className="min-h-screen pb-6 px-6 md:px-10 pt-6 bg-gray-50 animate-pulse">
      <article className="bg-white shadow rounded-2xl max-w-7xl mx-auto px-6 py-8">
        {/* 🔹 Encabezado */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="h-6 w-48 bg-gray-200 rounded mb-2" />
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-gray-200 rounded-full" />
              <div className="h-4 w-24 bg-gray-200 rounded" />
            </div>
          </div>
          <div className="h-9 w-28 bg-gray-200 rounded-md" />
        </div>

        {/* 🖼️ Galería simulada */}
        <div className="mt-6 w-full overflow-hidden rounded-xl">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-[2px]">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`relative bg-gray-200 ${
                  i === 0 ? "col-span-2 row-span-2 min-h-[350px]" : "min-h-[180px]"
                }`}
              />
            ))}
          </div>
        </div>

        {/* 🔹 Descripción */}
        <div className="mt-6 space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>

        {/* 🔹 Enlaces */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50">
            <div className="w-10 h-10 bg-gray-200 rounded-md" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50">
            <div className="w-10 h-10 bg-gray-200 rounded-md" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>

        {/* 🔹 Acciones sociales */}
        <div className="flex items-center justify-around border-t pt-4 mt-6 text-gray-600 text-sm">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-5 w-5 bg-gray-200 rounded-full" />
              <div className="h-4 w-10 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}
