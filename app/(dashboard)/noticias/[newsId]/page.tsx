"use client";

import React, { useState } from "react";
import { useSingleNews } from "@/queries/news";
import { use } from "react";
import { useRouter } from "next/navigation";
import { SingleNewsPageSkeleton } from "@/components/skeletons/news/single-news-page-skeleton";
import Image from "next/image";
import { ArticleFile } from "./_components/article-file";
import { ArticleComments } from "./_components/article-comments";
import { ProgressBar } from "@/components/common/progress-bar";
import { GalleryModal } from "@/components/common/gallery-modal";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface ImageItem {
  id: string;
  url: string;
  alt: string;
  title?: string;
}

interface GridLayoutItem {
  span: string;
  height: string;
}

interface GridLayout {
  gridClass: string;
  items: GridLayoutItem[];
}

interface SymmetricImageGridProps {
  images: ImageItem[];
  onImageClick: (index: number) => void;
}

// Componente para el mosaico simétrico de imágenes
const SymmetricImageGrid: React.FC<SymmetricImageGridProps> = ({
  images,
  onImageClick,
}) => {
  const imageCount: number = images.length;

  const getGridLayout = (): GridLayout => {
    switch (imageCount) {
      case 1:
        return {
          gridClass: "grid-cols-1",
          items: [{ span: "col-span-1", height: "h-[500px]" }],
        };
      case 2:
        return {
          gridClass: "grid-cols-2",
          items: [
            { span: "col-span-1", height: "h-[400px]" },
            { span: "col-span-1", height: "h-[400px]" },
          ],
        };
      case 3:
        return {
          gridClass: "grid-cols-2",
          items: [
            { span: "col-span-2", height: "h-[300px]" },
            { span: "col-span-1", height: "h-[250px]" },
            { span: "col-span-1", height: "h-[250px]" },
          ],
        };
      case 4:
        return {
          gridClass: "grid-cols-2",
          items: [
            { span: "col-span-1", height: "h-[300px]" },
            { span: "col-span-1", height: "h-[300px]" },
            { span: "col-span-1", height: "h-[300px]" },
            { span: "col-span-1", height: "h-[300px]" },
          ],
        };
      case 5:
        return {
          gridClass: "grid-cols-3",
          items: [
            { span: "col-span-2 row-span-2", height: "h-full" },
            { span: "col-span-1", height: "h-[200px]" },
            { span: "col-span-1", height: "h-[200px]" },
            { span: "col-span-1", height: "h-[200px]" },
            { span: "col-span-1", height: "h-[200px]" },
          ],
        };
      default: // 6 o más
        return {
          gridClass: "grid-cols-3",
          items: Array(Math.min(6, imageCount)).fill({
            span: "col-span-1",
            height: "h-[250px]",
          }),
        };
    }
  };

  const layout: GridLayout = getGridLayout();
  const displayImages: ImageItem[] = images.slice(0, 6);
  const remainingCount: number = imageCount > 6 ? imageCount - 6 : 0;

  return (
    <div className="w-full overflow-hidden rounded-xl">
      <div className={`grid ${layout.gridClass} gap-1`}>
        {displayImages.map((img: ImageItem, index: number) => {
          const itemLayout: GridLayoutItem =
            layout.items[index] || layout.items[0];
          const isLast: boolean = index === 5 && remainingCount > 0;

          return (
            <div
              key={img.id || index}
              onClick={() => onImageClick(index)}
              className={`relative cursor-pointer overflow-hidden bg-gray-200 group ${itemLayout.span} ${itemLayout.height}`}
            >
              <Image
                src={img.url}
                alt={img.alt || `Imagen ${index + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {isLast && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <span className="text-white text-4xl font-bold">
                    +{remainingCount}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function SingleNewsPage({
  params,
}: {
  params: Promise<{ newsId: string }>;
}) {
  const router = useRouter();
  const { newsId: id } = use(params);
  const { data: news, isLoading, isError, error } = useSingleNews(id as string);

  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false);
  const [startIndex, setStartIndex] = useState<number>(0);

  if (isLoading) return <SingleNewsPageSkeleton />;
  if (isError) return <div>Error: {error?.message}</div>;
  if (!news?.id) return router.push("/noticias");

  const formattedDate = new Date(news.created).toISOString().split("T")[0];

  // Combinar imagen principal + galería
  const allImages: ImageItem[] = [
    ...(news.field_main_image ? [news.field_main_image] : []),
    ...(news.field_gallery || []),
  ];

  const openGallery = (index: number): void => {
    setStartIndex(index);
    setIsGalleryOpen(true);
  };

  return (
    <div className="md:pb-10 px-6 md:px-10 pt-6 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Inicio</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/noticias" className="flex items-center gap-3">Noticias <ProgressBar /></BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="min-h-screen bg-muted/30">
        <article className="container mx-auto bg-white rounded-2xl shadow-md p-6 md:p-10">
          {/* Title */}
          <h1 className="text-2xl md:text-4xl mb-4">{news.title}</h1>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-lg text-[#76b9d7] mb-8">
            <div className="flex items-center gap-1">
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Body */}
          <div className="prose prose-lg max-w-none mb-10 leading-relaxed">
            <div dangerouslySetInnerHTML={{ __html: news.body }} />
          </div>

          {/* Mosaico de imágenes (imagen principal + galería) */}
          {allImages.length > 0 && (
            <div className="mb-12 md:mt-20">
              <h3 className="flex items-center text-2xl mb-4">
                <Image
                  src="/icons/blue-image.png"
                  alt="Image icon"
                  width={40}
                  height={40}
                  priority
                  className="size-[23px] mr-2"
                />{" "}
                <span className="mr-3">Galería</span>
                <ProgressBar />
              </h3>
              <SymmetricImageGrid
                images={allImages}
                onImageClick={openGallery}
              />
            </div>
          )}

          {/* File */}
          {news.field_file_new?.display && <ArticleFile news={news} />}

          {/* Comments */}
          <ArticleComments news={news} newsId={id!} />
        </article>
      </div>

      {/* Modal de galería */}
      {isGalleryOpen && (
        <GalleryModal
          images={allImages}
          initialIndex={startIndex}
          onClose={() => setIsGalleryOpen(false)}
        />
      )}
    </div>
  );
}
