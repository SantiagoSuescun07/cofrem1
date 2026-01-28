"use client";

import React, { useState } from "react";
import { useNews } from "@/queries/news";
import { NewsCardSkeleton } from "../skeletons/news/news-card-skeleton";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  containerVariants,
  itemVariants,
} from "@/constants/animation.-variants";
import { Pagination } from "./pagination";
import { NewsCard } from "../noticias/news-card";
import { HomeNewsCard } from "../noticias/home-news-card";

export function NewsSection() {
  const [page, setPage] = useState(1);
  const { data: news, isLoading } = useNews();

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <NewsCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  // Asegurar ordenamiento de más reciente a más antigua
  const sortedItems = news?.items
    ? [...news.items].sort((a, b) => {
        const dateA = new Date(a.created).getTime();
        const dateB = new Date(b.created).getTime();
        return dateB - dateA; // Orden descendente (más reciente primero)
      })
    : [];

  const limit = 10;
  const totalItems = sortedItems.length;
  const totalPages = Math.ceil(totalItems / limit);

  const paginatedItems = sortedItems.slice((page - 1) * limit, page * limit);

  return (
    <div className="lg:col-span-2 mt-14">
      <div className="flex items-center justify-end mb-6">
        <Link
          href="/noticias"
          className="text-muted-foreground transition-colors hover:underline"
        >
          Ver todas
        </Link>
      </div>
      <motion.div
        key={page}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="space-y-6"
      >
        <AnimatePresence mode="popLayout">
          {paginatedItems.map((item) => (
            <motion.div
              key={item.id}
              variants={itemVariants}
              exit="exit"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              {/* <NewsCard news={item} /> */}
              <HomeNewsCard 
                news={item}

              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Paginación */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </motion.div>
      )}
    </div>
  );
}
