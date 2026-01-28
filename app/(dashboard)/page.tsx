"use client";

import { HeroSection } from "@/components/common/hero-section";
import { NewsSection } from "@/components/common/news-section";
import { RightSidebar } from "@/components/common/right-sidebar";
import { QuickAccessGrid } from "@/components/common/quick-access-grid";
import { useRouter } from "next/navigation";
import { PublicationsSection } from "@/components/common/publications-section";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-6 md:px-10 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <HeroSection />
          <QuickAccessGrid />

          <NewsSection />
          <PublicationsSection />
        </div>
        <div className="lg:sticky lg:top-6 lg:self-start lg:h-[calc(100svh-1.5rem-1.5rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-2 lg:pb-2">
          <RightSidebar onPlayGames={() => router.push("/games")} />
        </div>
      </div>
    </div>
  );
}
