"use client";

import { useSearchParams } from "next/navigation";
import { useSearch } from "@/queries/search/use-search";
import { SearchResult } from "@/services/search/search-content";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, Loader2, FileText, Calendar, Users, Newspaper, BookOpen } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/utils/format-date";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams?.get("q") || "";
  const { data: searchResults, isLoading } = useSearch(query);

  const getTypeIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "news":
        return <Newspaper className="h-5 w-5" />;
      case "publication":
        return <FileText className="h-5 w-5" />;
      case "newsletter":
        return <Calendar className="h-5 w-5" />;
      case "directory":
        return <Users className="h-5 w-5" />;
      case "magazine":
        return <BookOpen className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getTypeLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "news":
        return "Noticia";
      case "publication":
        return "Publicación";
      case "newsletter":
        return "Boletín";
      case "directory":
        return "Directorio";
      case "magazine":
        return "Revista Enlace";
      default:
        return "Contenido";
    }
  };

  const getTypeColor = (type: SearchResult["type"]) => {
    switch (type) {
      case "news":
        return "bg-blue-100 text-blue-700";
      case "publication":
        return "bg-green-100 text-green-700";
      case "newsletter":
        return "bg-purple-100 text-purple-700";
      case "directory":
        return "bg-orange-100 text-orange-700";
      case "magazine":
        return "bg-pink-100 text-pink-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (!query) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <Search className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Buscar en COFREM
          </h1>
          <p className="text-gray-600">
            Ingresa un término de búsqueda para encontrar contenido
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
            Resultados de búsqueda
          </h1>
          <p className="text-gray-600">
            {isLoading ? (
              "Buscando..."
            ) : searchResults ? (
              <>
                {searchResults.total > 0 ? (
                  <>
                    {searchResults.total} resultado{searchResults.total !== 1 ? "s" : ""} para{" "}
                    <span className="font-medium">&quot;{query}&quot;</span>
                  </>
                ) : (
                  <>
                    No se encontraron resultados para{" "}
                    <span className="font-medium">&quot;{query}&quot;</span>
                  </>
                )}
              </>
            ) : null}
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
            <p className="text-gray-600">Buscando contenido...</p>
          </div>
        ) : searchResults && searchResults.results.length > 0 ? (
          <div className="space-y-4">
            {searchResults.results.map((result) => (
              <Link
                key={`${result.type}-${result.id}`}
                href={result.url}
                className="block bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all p-4 md:p-6"
              >
                <div className="flex gap-4">
                  {result.image && (
                    <div className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={result.image.url}
                        alt={result.image.alt}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(
                          result.type
                        )}`}
                      >
                        {getTypeIcon(result.type)}
                        {getTypeLabel(result.type)}
                      </span>
                      {result.created && (
                        <span className="text-xs text-gray-500">
                          {formatDate(result.created)}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                      {result.title}
                    </h3>
                    {result.description && (
                      <p className="text-sm md:text-base text-gray-600 line-clamp-2">
                        {result.description}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Search className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No se encontraron resultados
            </h2>
            <p className="text-gray-600 mb-6">
              Intenta con otros términos de búsqueda o verifica la ortografía
            </p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Volver
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

