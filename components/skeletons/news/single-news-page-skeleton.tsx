import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function SingleNewsPageSkeleton() {
  return (
    <div className="min-h-screen bg-muted/30 py-6 px-4 md:py-10">
      <article className="container mx-auto bg-white rounded-2xl shadow-md p-6 md:p-10">
        {/* Back button */}
        <Skeleton className="h-10 w-36 mb-6" />

        {/* Title */}
        <Skeleton className="h-8 w-3/4 mb-4" />

        {/* Metadata */}
        <div className="flex gap-4 mb-8">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Main image */}
        <Skeleton className="w-full h-64 mb-8 rounded-lg" />

        {/* Body */}
        <div className="space-y-3 mb-10">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* Gallery */}
        <div className="mb-12">
          <Skeleton className="h-6 w-24 mb-4" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-1/3 rounded-lg" />
            ))}
          </div>
        </div>

        {/* File */}
        <Card className="mb-12 border border-dashed border-gray-300 bg-muted/20">
          <CardContent className="flex justify-between items-center py-4 px-6">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-10 w-28" />
          </CardContent>
        </Card>

        {/* Comments */}
        <Card>
          <CardContent className="space-y-4">
            <Skeleton className="h-5 w-28" />
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, idx) => (
                <div key={idx} className="flex gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </article>
    </div>
  );
}
