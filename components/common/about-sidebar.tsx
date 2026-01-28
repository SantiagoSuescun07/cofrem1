"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  AboutUsMenuItem,
  AboutUsNode,
  fetchAboutUsMenu,
  fetchAboutUsNode,
} from "@/services/about/get-menu";

interface AboutSidebarProps {
  onSelectSection: (section: AboutUsNode) => void;
}

export function AboutSidebar({ onSelectSection }: AboutSidebarProps) {
  const [menuItems, setMenuItems] = useState<AboutUsMenuItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const items = await fetchAboutUsMenu();
        setMenuItems(items);

        if (items.length > 0) {
          const firstItem = items[0];
          const nodeId = firstItem.relative.replace("/node/", "");
          setActiveId(nodeId);

          // Cargar contenido inicial
          const node = await fetchAboutUsNode(nodeId);
          onSelectSection(node);
        }
      } catch (error) {
        console.error("Error cargando el menú de Nosotros:", error);
      }
    };
    loadMenu();
  }, [onSelectSection]);

  const handleSelect = async (relative: string) => {
    try {
      const nodeId = relative.replace("/node/", "");
      const node = await fetchAboutUsNode(nodeId);
      setActiveId(nodeId);
      onSelectSection(node);
    } catch (error) {
      console.error("Error cargando contenido:", error);
    }
  };

  return (
    <aside className="w-72 bg-white border-r border-gray-200 h-full overflow-y-auto p-4 shadow-sm">
      <h2 className="text-lg text-[#24b0d6] mb-4">Nosotros</h2>

      <ul className="space-y-2">
        {menuItems.map((item) => {
          const nodeId = item.relative.replace("/node/", "");
          const isActive = activeId === nodeId;

          return (
            <li key={item.key}>
              <button
                onClick={() => handleSelect(item.relative)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg transition-colors cursor-pointer",
                  isActive
                    ? "bg-[#e0f7ff] text-[#0078a8]"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                {item.title}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
