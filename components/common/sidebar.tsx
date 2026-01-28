"use client";

import React from "react";
import { X } from "lucide-react";
import * as Icons from "lucide-react";
import { UserProfile } from "@/components/common/user-profile";
import { User, SidebarItem, ModuleType } from "@/types";
import { SignOutButton } from "./sign-out-button";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  sidebarItems: SidebarItem[];
  activeModule: string;
  onModuleChange: (module: ModuleType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sidebarItems,
  onModuleChange,
}) => {
  const router = useRouter();
  const pathname = usePathname();

  const handleModuleClick = (id: ModuleType, route: string): void => {
    router.push(route);
    onModuleChange(id);
    onClose();
  };

  // Determinar si estamos en una página que requiere el sidebar siempre visible en desktop
  const isAlwaysVisible = !pathname.startsWith("/nosotros");
  
  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } transition-transform duration-300 ease-in-out ${
        isAlwaysVisible ? "lg:translate-x-0 lg:static lg:inset-0" : ""
      }`}
    >
      {/* Header Cofrem */}
      <div className="flex items-center justify-between h-[74px] px-6 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <Image
            src="/icons/logo_cofrem.svg"
            alt=""
            width={100}
            height={30}
            priority
            className="h-[40px] w-auto"
          />
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-lg hover:bg-[#2deb7915]"
          aria-label="Cerrar menú"
        >
          <X size={20} className="text-[#306393]" />
        </button>
      </div>

      {/* Perfil */}
      <button
        onClick={() => router.push("/profile")}
        className="p-6 border-b border-gray-100 cursor-pointer hover:bg-[#2deb7915] w-full transition-colors"
      >
        <UserProfile />
      </button>

      {/* Navegación */}
      <nav className="p-4 space-y-1">
        {sidebarItems.map((item) => {
          const IconComponent = Icons[
            item.icon as keyof typeof Icons
          ] as React.ComponentType<{
            size?: number;
            className?: string;
          }>;

          const isActive =
            pathname === item.url || pathname.startsWith(item.url + "/");

          return (
            <button
              key={item.id}
              onClick={() => handleModuleClick(item.id as ModuleType, item.url)}
              className={`cursor-pointer w-full flex items-center px-4 py-3 text-left rounded-lg font-medium transition-all duration-200 ${
                isActive
                  ? "bg-[#e4fef1] border-l-4 border-[#11c99d]"
                  : "text-gray-600 hover:bg-[#e4fef1]"
              }`}
            >
              <Image 
                src={item.icon}
                alt={item.label}
                width={20}
                height={20}
                priority
                className="mr-3"
                style={{ width: "20px", height: "auto" }}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Botón Cerrar sesión */}
      <div className="w-full mt-2 px-4">
        <SignOutButton className="w-full bg-[#d6edfb] text-[#2f8cbd] border border-[#2da2eb40] hover:bg-[#2da2eb25] hover:text-[#2da2eb] transition-colors" />
      </div>
    </div>
  );
};
