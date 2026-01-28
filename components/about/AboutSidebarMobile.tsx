"use client";
import React, { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import Image from "next/image";
import { UserProfile } from "@/components/common/user-profile";
import {
  AboutUsMenuItem,
  AboutUsNode,
  fetchAboutUsMenu,
  fetchAboutUsNode,
} from "@/services/about/get-menu";

interface AboutSidebarMobileProps {
  open: boolean;
  setOpen: (v: boolean) => void;
  onShowMainSidebar: () => void;
  onSelectSection: (section: AboutUsNode) => void;
  router: any;
}

export const AboutSidebarMobile = ({
  open,
  setOpen,
  onShowMainSidebar,
  onSelectSection,
  router,
}: AboutSidebarMobileProps) => {
  const [menuItems, setMenuItems] = useState<AboutUsMenuItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const items = await fetchAboutUsMenu();
        setMenuItems(items);
        if (items.length > 0) {
          const first = items[0];
          const nodeId = first.relative.replace("/node/", "");
          setActiveId(nodeId);
          const node = await fetchAboutUsNode(nodeId);
          onSelectSection(node);
        }
      } catch (e) {
        console.error("Error cargando menú móvil de Nosotros:", e);
      }
    };
    loadMenu();
  }, [onSelectSection]);

  const handleSelect = async (relative: string) => {
    const nodeId = relative.replace("/node/", "");
    const node = await fetchAboutUsNode(nodeId);
    setActiveId(nodeId);
    onSelectSection(node);
    setOpen(false);
  };

  return (
    <div className="md:hidden border-b bg-white">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="p-0 w-72 overflow-y-auto">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>
              <Image
                src="/icons/logo_cofrem.svg"
                alt="Logo"
                width={100}
                height={30}
                className="h-[40px] w-auto"
              />
            </SheetTitle>
          </SheetHeader>

          <button
            onClick={() => router.push("/profile")}
            className="p-6 border-b border-gray-100 hover:bg-[#2deb7915] transition-colors"
          >
            <UserProfile />
          </button>

          <nav className="flex-1 overflow-y-auto p-4">
            <button
              onClick={() => {
                setOpen(false);
                onShowMainSidebar();
              }}
              className="flex items-center gap-2 text-[#2f8cbd] font-medium mb-4 hover:text-[#11c99d]"
            >
              <Menu className="h-5 w-5" />
              <span>Menú Principal</span>
            </button>

            <ul className="flex flex-col h-auto w-full bg-transparent space-y-1">
              {menuItems.map((item) => {
                const nodeId = item.relative.replace("/node/", "");
                const isActive = activeId === nodeId;
                return (
                  <li key={item.key}>
                    <button
                      onClick={() => handleSelect(item.relative)}
                      className={`w-full justify-between items-start px-3 py-2.5 text-sm text-left rounded-md flex whitespace-normal leading-tight transition-colors ${
                        isActive
                          ? "bg-[#e4fef1] text-[#11c99d]"
                          : "hover:bg-[#e4fef1] text-gray-700"
                      }`}
                    >
                      {item.title}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
};
