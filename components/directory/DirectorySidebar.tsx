"use client";
import React, { useState } from "react";
import { Menu, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import { UserProfile } from "@/components/common/user-profile";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import clsx from "clsx";

interface DirectorySidebarProps {
  areas: any[];
  openCollapse: string | null;
  setOpenCollapse: (v: string | null) => void;
  router: any;
  onShowMainSidebar: () => void;
}

export const DirectorySidebar = ({
  areas,
  openCollapse,
  setOpenCollapse,
  router,
  onShowMainSidebar,
}: DirectorySidebarProps) => {
  const [activeSubdivision, setActiveSubdivision] = useState<string | null>(
    null
  );

  return (
    <aside className="hidden md:flex md:w-72 bg-white border-r border-gray-100 flex-col sticky top-0 h-screen z-10">
      {/* Logo */}
      <div className="flex items-center justify-between h-[74px] px-6 border-b border-gray-100">
        <Image
          src="/icons/logo_cofrem.svg"
          alt="Logo"
          width={100}
          height={30}
          className="h-[40px] w-auto"
        />
      </div>

      {/* Perfil */}
      <button
        onClick={() => router.push("/profile")}
        className="p-6 border-b border-gray-100 hover:bg-[#2deb7915] transition-colors"
      >
        <UserProfile />
      </button>

      {/* Menú */}
      <nav className="flex-1 overflow-y-auto p-4">
        <button
          onClick={onShowMainSidebar}
          className="flex items-center gap-2 text-[#2f8cbd] font-medium mb-4 hover:text-[#11c99d] mx-auto"
        >
          <Menu className="h-5 w-5" />
          <span>Menú Principal</span>
        </button>

        <TabsList className="flex flex-col h-auto w-full bg-transparent space-y-1 text-center">
          {areas.map((area) => (
            <div key={area.id} className="w-full">
              {/* Área principal */}
              <TabsTrigger
                value={String(area.id)}
                onClick={() =>
                  area.children?.length
                    ? setOpenCollapse(
                        openCollapse === String(area.id)
                          ? null
                          : String(area.id)
                      )
                    : setActiveSubdivision(area.id)
                }
                className={clsx(
                  "w-full flex justify-between items-center px-3 py-2.5 text-sm rounded-md text-center transition-all duration-200 ",
                  openCollapse === String(area.id) 
                    // activeSubdivision === String(area.id)
                    ? "!bg-[#1f8e74] text-[#ffffff] font-medium"
                    : "hover:bg-[#f5f5f5] text-gray-700"
                )}
              >
                <span className="break-words line-clamp-3 leading-snug transition-colors duration-200 whitespace-normal text-center mx-auto">
                  {area.name}
                </span>
                  {area.children?.length > 0 &&
                    (openCollapse === String(area.id) ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    ))}
              </TabsTrigger>

              {/* Subdivisiones */}
              {area.children?.length > 0 &&
                openCollapse === String(area.id) && (
                  <div className="mt-1 ml-2 flex flex-col gap-1">
                    {area.children.map((child: any) => (
                      <TabsTrigger
                        key={child.id}
                        value={String(child.id)}
                        onClick={() => setActiveSubdivision(String(child.id))}
                        className={clsx(
                          "px-3 py-2 text-sm rounded-md text-left transition-colors duration-200 whitespace-normal break-words line-clamp-3",
                          activeSubdivision === String(child.id)
                            ? "!bg-[#11c99d] !text-white !font-medium"
                            : "bg-[#e4fef1] text-[#11c99d] hover:bg-[#b8f3d7]"
                        )}
                      >
                        {child.name}
                      </TabsTrigger>
                    ))}
                  </div>
                )}
            </div>
          ))}
        </TabsList>
      </nav>
    </aside>
  );
};
