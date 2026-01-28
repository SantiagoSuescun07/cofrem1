import Link from "next/link";
import Image from "next/image";
import { News } from "@/types/news/news";
import { ProgressBar } from "@/components/common/progress-bar";

interface ArticleFileProps {
  news: News;
}

export function ArticleFile({ news }: ArticleFileProps) {
  return (
    <div className="mb-8 rounded-2xl transition">
      <div className="px-6 py-4">
        <h3 className="flex items-center text-2xl mb-4">
          <Image
            src="/icons/blue-folder.png"
            alt="Image icon"
            width={40}
            height={40}
            priority
            className="size-[23px] mr-2"
          />{" "}
          <span className="mr-3">Archivo</span>
          <ProgressBar />
        </h3>

        {/* Info del archivo */}
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            {news?.field_file_new?.description || "Documento PDF"}
          </p>

          {/* Botón de descarga */}
          <div className="flex items-center gap-3 pl-4">
            <Link 
              target="_blank" 
              href={news?.field_file_new?.url!} 
              download
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Image
                src="/icons/pdf-icon.png"
                alt="PDF icon"
                width={40}
                height={40}
                priority
                className="w-[30px] h-[40px] object-cover"
              />
              <span className="text-blue-600 hover:underline font-medium">
                {news?.field_file_new?.filename || "Descargar PDF"}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
