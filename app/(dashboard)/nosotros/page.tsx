"use client";

import { AboutContent } from "@/components/common/about-content";
import { AboutSidebar } from "@/components/common/about-sidebar";
import { AboutUsNode } from "@/services/about/get-menu";
import { useState } from "react";

export default function AboutUsPage() {
  const [selectedSection, setSelectedSection] = useState<AboutUsNode | null>(null);

  return (
    <div className="flex h-[calc(100vh-80px)] bg-gray-50">
      <AboutSidebar onSelectSection={setSelectedSection} />
      <AboutContent key={selectedSection?.nid} section={selectedSection} />
    </div>
  );
}
