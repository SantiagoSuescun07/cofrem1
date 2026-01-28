"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { Tabs } from "@/components/ui/tabs";
import { Header } from "@/components/common/header";
import { Sidebar } from "@/components/common/sidebar";
import { BreadcrumbHeader } from "@/components/directory/breadcrumb-header";
import { useAreas } from "@/queries/directory/useAreas";
import { DirectorySidebar } from "@/components/directory/DirectorySidebar";
import { DirectorySidebarMobile } from "@/components/directory/DirectorySidebarMobile";
import { DirectoryTabsContent } from "@/components/directory/DirectoryTabsContent";
import { DirectorySkeleton } from "@/components/directory/skeleton-directory";
import { AboutSidebar } from "@/components/about/AboutSidebar";
import { AboutSidebarMobile } from "@/components/about/AboutSidebarMobile";
import { AboutContent } from "@/components/common/about-content";
import { AboutUsNode } from "@/services/about/get-menu";
import { ManagementSystemLayout } from "@/components/management/ManagementSystemLayout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const router = useRouter();

  // Inicialización de módulos - se establecerá dinámicamente cuando se carguen los documentos
  const [openCollapser, setOpenCollapser] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showMainSidebar, setShowMainSidebar] = useState(false);
  const [showMainSheet, setShowMainSheet] = useState(false);
  const [openCollapse, setOpenCollapse] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<AboutUsNode | null>(
    null
  );
  const [notifications] = useState(3);
  const [activeModule, setActiveModule] = useState("dashboard");

  const [currentUser] = useState({
    name: "María González",
    email: "maria.gonzalez@cofrem.gov.co",
    avatar: "https://www.factoryim.co/maria.jpeg",
    role: "Analista de RRHH",
    area: "Recursos Humanos",
    sede: "Sede Principal",
  });

  const sidebarItems = [
    { id: "dashboard", label: "Inicio", icon: "/icons/home.png", url: "/" },
    { id: "news", label: "Noticias", icon: "/icons/news.png", url: "/noticias" },
    {
      id: "directory",
      label: "Directorio",
      icon: "/icons/directory.png",
      url: "/directory",
    },
    {
      id: "management-system",
      label: "Sistema de Gestión de Calidad",
      icon: "/icons/management-system.png",
      url: "/management-system",
    },
    {
      id: "about",
      label: "Nosotros",
      icon: "/icons/about-us.png",
      url: "/nosotros",
    },
    {
      id: "games",
      label: "Gamificación",
      icon: "/icons/gamification.png",
      url: "/games",
    },
    {
      id: "calendar",
      label: "Calendario",
      icon: "/icons/calendar.png",
      url: "/calendar",
    },
    { id: "pqrs", label: "PQRS", icon: "/icons/news.png", url: "/pqrs" },
  ];

  const { data: areas, isLoading } = useAreas();

  // Verificar si hay refresh token en localStorage y redirigir al login si no hay
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Si no hay sesión y no hay refresh token, redirigir al login
    if (!session) {
      const refreshToken = localStorage.getItem("cofrem.refresh_token");
      if (!refreshToken) {
        // No hay sesión ni refresh token, redirigir al login
        router.push("/auth/login");
        return;
      }
    }
  }, [session, router]);

  useEffect(() => {
    // Si no hay sesión o la sesión es inválida
    if (!session || !session.drupal?.accessToken) {
      // Solo limpiar el access_token y expires_at, pero NO el refresh_token
      // El refresh_token se mantiene para permitir reintentos de refresh
      localStorage.removeItem("cofrem.access_token");
      localStorage.removeItem("cofrem.expires_at");
      localStorage.removeItem("cofrem.user");
      
      // Solo limpiar el refresh_token si realmente no existe en la sesión
      // y tampoco existe en localStorage (para evitar perderlo innecesariamente)
      const storedRefreshToken = localStorage.getItem("cofrem.refresh_token");
      if (!session?.drupal?.refreshToken && !storedRefreshToken) {
        localStorage.removeItem("cofrem.refresh_token");
      }
      return;
    }

    // Si hay sesión válida, sincronizar tokens INMEDIATAMENTE
    // Esto es crítico para que las queries tengan el token disponible
    if (session.drupal.accessToken) {
      const currentToken = localStorage.getItem("cofrem.access_token");
      
      // Sincronizar el token SIEMPRE que cambie o no exista
      // No solo cuando cambie, sino también cuando no existe para asegurar que esté disponible
      if (!currentToken || currentToken !== session.drupal.accessToken) {
        console.log("🔄 Sincronizando token desde sesión a localStorage");
        localStorage.setItem("cofrem.access_token", session.drupal.accessToken);
        
        if (session.drupal.user) {
          localStorage.setItem("cofrem.user", JSON.stringify(session.drupal.user));
        }
        
        // Guardar también la fecha de expiración si está disponible
        if (session.drupal.expiresAt) {
          localStorage.setItem("cofrem.expires_at", String(session.drupal.expiresAt));
        }
        
        console.log("✅ Token sincronizado:", session.drupal.accessToken.substring(0, 50) + "...");
      }
      
      // Guardar el refresh_token siempre que esté disponible
      // Esto asegura que se mantenga actualizado si viene uno nuevo
      if (session.drupal.refreshToken) {
        localStorage.setItem("cofrem.refresh_token", session.drupal.refreshToken);
      }
    }
  }, [session]);

  useEffect(() => {
    if (!pathname.startsWith("/directory")) setShowMainSidebar(false);
    if (!pathname.startsWith("/nosotros")) setShowMainSidebar(false);
    // Cerrar el sidebar principal cuando se abre la página de nosotros
    if (pathname.startsWith("/nosotros")) {
      setSidebarOpen(false);
    }
  }, [pathname]);

  // 🔹 Directorio Layout
  if (pathname.startsWith("/directory")) {
    if (isLoading || !areas?.length) {
      return <DirectorySkeleton />;
    }

    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 relative">
        <Tabs
          defaultValue={String(areas[0].id)}
          orientation="vertical"
          className="flex flex-1 flex-col md:flex-row w-full gap-0"
        >
          <DirectorySidebar
            areas={areas}
            openCollapse={openCollapse}
            setOpenCollapse={setOpenCollapse}
            router={router}
            onShowMainSidebar={() => setShowMainSidebar(true)}
          />
          <DirectorySidebarMobile
            open={showMainSheet}
            setOpen={setShowMainSheet}
            areas={areas}
            openCollapse={openCollapse}
            setOpenCollapse={setOpenCollapse}
            router={router}
            onShowMainSidebar={() => setShowMainSidebar(true)}
          />
          <main className="flex-1 flex flex-col overflow-hidden">
            <Header
              onMenuClick={() => setShowMainSheet(true)}
              notifications={notifications}
            />
            <BreadcrumbHeader name="Directorio" />
            <div className="flex-1 overflow-y-auto p-8">
              <DirectoryTabsContent areas={areas} />
            </div>
          </main>
        </Tabs>

        {showMainSidebar && (
          <div className="fixed inset-0 z-50 flex">
            <Sidebar
              isOpen
              onClose={() => setShowMainSidebar(false)}
              currentUser={currentUser}
              sidebarItems={sidebarItems}
              activeModule={activeModule}
              onModuleChange={(id) => {
                setActiveModule(id);
                setShowMainSidebar(false);
                const item = sidebarItems.find((s) => s.id === id);
                if (item?.url) router.push(item.url);
              }}
            />
          </div>
        )}
      </div>
    );
  }
  if (pathname.startsWith("/nosotros")) {
    if (isLoading || !areas?.length) {
      return <DirectorySkeleton />;
    }

    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 relative">
        <AboutSidebar
          onSelectSection={setSelectedSection}
          router={router}
          onShowMainSidebar={() => setSidebarOpen(true)}
        />
        <AboutSidebarMobile
          open={showMainSheet}
          setOpen={setShowMainSheet}
          router={router}
          onSelectSection={setSelectedSection}
          onShowMainSidebar={() => setSidebarOpen(true)}
        />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Header
            onMenuClick={() => setSidebarOpen(true)}
            notifications={notifications}
          />
          <BreadcrumbHeader name="Nosotros" />
          <div className="flex-1 overflow-y-auto p-8">
            <AboutContent section={selectedSection} />
          </div>
        </main>

        {/* Sidebar principal - solo se muestra cuando sidebarOpen es true */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-[60] flex">
            {/* Overlay de fondo */}
            <div 
              className="fixed inset-0 z-[60]"
              onClick={() => setSidebarOpen(false)}
            />
            {/* Sidebar */}
            <div className="relative z-[61]">
              <Sidebar
                isOpen
                onClose={() => setSidebarOpen(false)}
                currentUser={currentUser}
                sidebarItems={sidebarItems}
                activeModule={activeModule}
                onModuleChange={(id) => {
                  setActiveModule(id);
                  setSidebarOpen(false);
                  const item = sidebarItems.find((s) => s.id === id);
                  if (item?.url) router.push(item.url);
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  if (pathname.startsWith("/management-system")) {
    return (
      <ManagementSystemLayout
        openCollapser={openCollapser}
        setOpenCollapser={setOpenCollapser}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        showMainSheet={showMainSheet}
        setShowMainSheet={setShowMainSheet}
        showMainSidebar={showMainSidebar}
        setShowMainSidebar={setShowMainSidebar}
        notifications={notifications}
        router={router}
        currentUser={currentUser}
        sidebarItems={sidebarItems}
        activeModule={activeModule}
        setActiveModule={setActiveModule}
      />
    );
  }

  // 🔹 Layout general
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentUser={currentUser}
        sidebarItems={sidebarItems}
        activeModule={activeModule}
        onModuleChange={(id) => {
          setActiveModule(id);
          const item = sidebarItems.find((s) => s.id === id);
          if (item?.url) router.push(item.url);
        }}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          notifications={notifications}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
