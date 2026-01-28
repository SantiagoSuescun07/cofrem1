import { Skeleton } from "@/components/ui/skeleton";
import { NewsCardSkeleton } from "@/components/skeletons/news/news-card-skeleton";

export function NewsPageSkeleton() {
  return (
    <div className="container mx-auto px-6 md:px-10 pt-6">
      <Skeleton className="h-6 w-40 mb-6" /> {/* Breadcrumb */}
      <Skeleton className="h-8 w-64 mb-8" /> {/* Título */}

      <div className="space-y-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <NewsCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
