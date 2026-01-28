"use client";
import React, { useEffect } from "react";
import { Tabs } from "@/components/ui/tabs";
import { Header } from "@/components/common/header";
import { Sidebar } from "@/components/common/sidebar";
import { BreadcrumbHeader } from "@/components/directory/breadcrumb-header";
import { ManagementSidebar } from "@/components/management/management-sidebar";
import { ManagementSidebarMobile } from "@/components/management/ManagementSidebarMobile";
import { ManagementContent } from "@/components/management/ManagementTabsContent";
import { useDocuments, useModules } from "@/queries/management";

interface ManagementSystemLayoutProps {
  openCollapser: string | null;
  setOpenCollapser: (v: string | null) => void;
  activeCategory: string | null;
  setActiveCategory: (v: string) => void;
  showMainSheet: boolean;
  setShowMainSheet: (v: boolean) => void;
  showMainSidebar: boolean;
  setShowMainSidebar: (v: boolean) => void;
  notifications: number;
  router: any;
  currentUser: any;
  sidebarItems: any[];
  activeModule: string;
  setActiveModule: (v: string) => void;
}

export const ManagementSystemLayout = ({
  openCollapser,
  setOpenCollapser,
  activeCategory,
  setActiveCategory,
  showMainSheet,
  setShowMainSheet,
  showMainSidebar,
  setShowMainSidebar,
  notifications,
  router,
  currentUser,
  sidebarItems,
  activeModule,
  setActiveModule,
}: ManagementSystemLayoutProps) => {
  const { data: documents, isLoading } = useDocuments();
  const { data: modules } = useModules();

  // Auto-seleccionar el primer módulo y su primera categoría cuando se cargan los módulos por primera vez
  useEffect(() => {
    if (modules && modules.length > 0 && !openCollapser && !activeCategory) {
      // Seleccionar el primer módulo
      const firstModule = modules[0];
      if (firstModule && firstModule.categories.length > 0) {
        const moduleId = firstModule.id.toString();
        setOpenCollapser(moduleId);
        
        // Seleccionar la primera categoría del módulo
        setActiveCategory(firstModule.categories[0].name);
      }
    }
  }, [modules, openCollapser, setOpenCollapser, activeCategory, setActiveCategory]);

  // Auto-seleccionar la primera categoría cuando se selecciona un módulo y no hay categoría activa
  useEffect(() => {
    if (modules && modules.length > 0 && openCollapser && !activeCategory) {
      // Buscar el módulo seleccionado
      const selectedModule = modules.find(
        (mod) => mod.id.toString() === openCollapser
      );
      if (selectedModule && selectedModule.categories.length > 0) {
        setActiveCategory(selectedModule.categories[0].name);
      }
    }
  }, [openCollapser, modules, activeCategory, setActiveCategory]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 relative">
      <Tabs
        orientation="vertical"
        className="flex flex-1 flex-col md:flex-row w-full gap-0"
      >
        <ManagementSidebar
          openCollapse={openCollapser}
          setOpenCollapse={setOpenCollapser}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          router={router}
          onShowMainSidebar={() => setShowMainSidebar(true)}
          documents={documents}
          isLoading={isLoading}
        />

        <ManagementSidebarMobile
          open={showMainSheet}
          setOpen={setShowMainSheet}
          openCollapse={openCollapser}
          setOpenCollapse={setOpenCollapser}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          router={router}
          onShowMainSidebar={() => setShowMainSidebar(true)}
          documents={documents}
          isLoading={isLoading}
        />

        <main className="flex-1 flex flex-col overflow-hidden">
          <Header
            onMenuClick={() => setShowMainSheet(true)}
            notifications={notifications}
          />
          <BreadcrumbHeader name="Gestion" />
          <div className="flex-1 overflow-y-auto p-8">
            <ManagementContent
              activeModule={openCollapser}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
            />
          </div>
        </main>
      </Tabs>

      {/* Sidebar principal modal */}
      {showMainSidebar && (
        <div className="fixed inset-0 z-50 flex">
          <Sidebar
            isOpen
            onClose={() => setShowMainSidebar(false)}
            currentUser={currentUser}
            sidebarItems={sidebarItems}
            activeModule={activeModule ?? ""}
            onModuleChange={(id) => {
              setActiveModule(id);
              setShowMainSidebar(false);
              const item = sidebarItems.find((s: any) => s.id === id);
              if (item?.url) router.push(item.url);
            }}
          />
        </div>
      )}
    </div>
  );
};

