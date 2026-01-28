import Image from "next/image";
import { News } from "@/types/news/news";

interface ArticleMainImageProps {
  news: News;
}

export function ArticleMainImage({ news }: ArticleMainImageProps) {
  return (
    <div className="mb-8 rounded-lg overflow-hidden">
      <Image
        src={news?.field_main_image?.url || "/placeholder.svg"}
        alt={news?.field_main_image?.alt ?? "Imagen principal"}
        width={news?.field_main_image?.width}
        height={news?.field_main_image?.height}
        className="w-full h-[400px] object-cover"
        priority
      />
    </div>
  );
}
