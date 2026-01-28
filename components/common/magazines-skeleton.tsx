"use client";

export function MagazinesSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 md:px-10 py-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <div className="h-4 w-12 bg-gray-200 rounded" />
            <span>/</span>
            <div className="h-4 w-32 bg-gray-200 rounded" />
          </div>
          <div className="h-1 w-24 bg-gray-200 rounded-full" />
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm"
            >
              {/* Imagen simulada */}
              <div className="h-[500px] w-full bg-gray-200" />

              {/* Texto */}
              <div className="p-6 space-y-3">
                <div className="h-5 w-3/4 bg-gray-200 rounded" />
                <div className="h-4 w-1/2 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
