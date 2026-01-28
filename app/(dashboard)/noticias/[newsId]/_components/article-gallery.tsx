import Image from "next/image";
import { News } from "@/types/news/news";

interface ArticleGalleryProps {
  news: News;
}

export function ArticleGallery({ news }: ArticleGalleryProps) {
  return (
    <div className="mb-8">
      <h3 className="text-2xl font-semibold mb-4">Galería</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {news?.field_gallery.map((image) => (
          <div key={image.id} className="rounded-lg overflow-hidden">
            <Image
              src={image.url || "/placeholder.svg"}
              alt={image.alt}
              width={image.width}
              height={image.height}
              className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
            />
            {image.title && (
              <p className="text-sm text-muted-foreground mt-2 px-1">
                {image.title}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
