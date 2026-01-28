"use client";
import React, { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Menu, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import { UserProfile } from "@/components/common/user-profile";
import { Document } from "@/types/documents";
import { useModules } from "@/queries/management";

interface ManagementSidebarMobileProps {
  open: boolean;
  setOpen: (v: boolean) => void;
  openCollapse: string | null;
  setOpenCollapse: (v: string | null) => void;
  activeCategory: string | null;
  setActiveCategory: (v: string) => void;
  router: any;
  onShowMainSidebar: () => void;
  documents: Document[] | undefined;
  isLoading: boolean;
}

interface CategoryWithSubareas {
  name: string;
  id: number;
  drupal_internal__tid: number;
  count: number;
  subareas?: CategoryWithSubareas[];
  isChild?: boolean; // true si es un child (subárea), false si es una categoría real
}

interface ModuleGroup {
  id: string;
  name: string;
  categories: CategoryWithSubareas[];
}

export const ManagementSidebarMobile = ({
  open,
  setOpen,
  openCollapse,
  setOpenCollapse,
  activeCategory,
  setActiveCategory,
  router,
  onShowMainSidebar,
  documents,
  isLoading,
}: ManagementSidebarMobileProps) => {
  const { data: modules, isLoading: isLoadingModules } = useModules();
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  // Función auxiliar para contar documentos de una categoría
  const countDocuments = (
    moduleId: string,
    categoryId: number
  ): number => {
    if (!documents) return 0;

    let count = 0;
    documents.forEach((doc) => {
      const docModuleId = doc.field_modulo?.drupal_internal__tid?.toString();
      const docCategoryId = doc.field_module_category?.drupal_internal__tid?.toString();
      const hasValidFiles =
        doc.field_file &&
        doc.field_file.length > 0 &&
        doc.field_file.some((file) => file && file.url && file.url.trim() !== "");

      if (
        docModuleId === moduleId &&
        docCategoryId === categoryId.toString() &&
        hasValidFiles
      ) {
        count++;
      }
    });

    return count;
  };

  // Función recursiva para procesar categorías con sus subáreas anidadas
  const processCategoryRecursive = (
    moduleId: string,
    category: { name: string; id?: number; drupal_internal__tid: number; subareas?: any[]; parentId?: number | null; isChild?: boolean }
  ): CategoryWithSubareas => {
    const categoryId = category.id || category.drupal_internal__tid;
    
    let count = 0;
    // Solo contar documentos si es una categoría real (no una subárea/child)
    if (!category.isChild) {
      count = countDocuments(moduleId, categoryId);
    }
    
    const processedSubareas = category.subareas?.map((subarea) =>
      processCategoryRecursive(moduleId, subarea)
    );

    return {
      name: category.name,
      id: categoryId,
      drupal_internal__tid: categoryId,
      count,
      subareas: processedSubareas,
      isChild: category.isChild,
    };
  };

  // Combinar módulos con conteo de documentos por categoría y subáreas
  const modulesGrouped = useMemo(() => {
    if (!modules || modules.length === 0) return [];

    return modules.map((module) => {
      const categoriesWithCount: CategoryWithSubareas[] = module.categories.map((category) =>
        processCategoryRecursive(module.id.toString(), category)
      );

      return {
        id: module.id.toString(),
        name: module.name,
        categories: categoriesWithCount,
      };
    });
  }, [modules, documents]);

  // Función para toggle de categorías abiertas
  const toggleCategory = (categoryKey: string) => {
    setOpenCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryKey)) {
        newSet.delete(categoryKey);
      } else {
        newSet.add(categoryKey);
      }
      return newSet;
    });
  };

  // Componente recursivo para renderizar categorías y subáreas
  const CategoryItem = ({
    category,
    moduleId,
    baseKey,
    level = 0,
  }: {
    category: CategoryWithSubareas;
    moduleId: string;
    baseKey: string;
    level?: number;
  }) => {
    const categoryKey = `${baseKey}-${category.id}`;
    const hasSubareas = category.subareas && category.subareas.length > 0;
    const isOpen = openCategories.has(categoryKey);
    
    // Calcular el conteo total recursivamente
    const getTotalCount = (cat: CategoryWithSubareas): number => {
      let total = cat.count;
      if (cat.subareas) {
        cat.subareas.forEach((sub) => {
          total += getTotalCount(sub);
        });
      }
      return total;
    };
    
    const totalCount = getTotalCount(category);
    // Solo mostrar el contador si NO es un child y NO tiene subáreas
    // Las categorías que tienen subcategorías (children) no muestran número
    // Las categorías sin subcategorías siempre muestran el número (incluso si es 0)
    const shouldShowCount = !category.isChild && !hasSubareas;

    const textSize = level === 0 ? "text-sm" : "text-xs";
    const paddingY = level === 0 ? "py-2" : "py-1.5";
    const borderColor = level === 0 ? "border-gray-100" : level === 1 ? "border-gray-200" : "border-gray-300";

    return (
      <div className="w-full">
        <button
          onClick={() => {
            if (hasSubareas) {
              toggleCategory(categoryKey);
            }
            // Solo seleccionar categoría si NO es un child (solo las categorías reales son seleccionables)
            if (!category.isChild) {
              setActiveCategory(category.name);
              if (!hasSubareas) {
                setOpen(false);
              }
            }
          }}
          className={`w-full flex justify-between items-center text-left ${textSize} px-3 ${paddingY} rounded-md transition-colors ${
            activeCategory === category.name && !hasSubareas && !category.isChild
              ? "bg-[#e4fef1] text-[#11c99d] font-medium"
              : category.isChild
              ? "hover:bg-gray-50 text-gray-600 font-medium"
              : "hover:bg-[#e4fef1] text-gray-700"
          }`}
        >
          <span>{category.name}</span>
          <div className="flex items-center gap-2">
            {shouldShowCount && (
              <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">
                {totalCount}
              </span>
            )}
            {hasSubareas && (
              isOpen ? (
                <ChevronUp className="h-3 w-3 text-gray-400" />
              ) : (
                <ChevronDown className="h-3 w-3 text-gray-400" />
              )
            )}
          </div>
        </button>

        {hasSubareas && isOpen && (
          <div className={`w-full mt-1 space-y-1 pl-3 border-l ${borderColor}`}>
            {category.subareas?.map((subarea) => (
              <CategoryItem
                key={`${categoryKey}-${subarea.id}`}
                category={subarea}
                moduleId={moduleId}
                baseKey={categoryKey}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
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

            {isLoading || isLoadingModules ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2f8cbd]"></div>
              </div>
            ) : modulesGrouped.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                <p>No hay módulos disponibles</p>
              </div>
            ) : (
              <div className="flex flex-col space-y-1">
                {modulesGrouped.map((mod) => (
                  <div key={mod.id} className="w-full">
                    {/* Botón del módulo principal */}
                    <button
                      onClick={() => {
                        const newOpenState = openCollapse === mod.id ? null : mod.id;
                        setOpenCollapse(newOpenState);
                        
                        // Si se abre el módulo y no hay categoría activa, seleccionar la primera categoría
                        if (newOpenState === mod.id && mod.categories.length > 0 && !activeCategory) {
                          setActiveCategory(mod.categories[0].name);
                        }
                      }}
                      className={`w-full flex justify-between items-center px-3 py-2.5 text-sm text-left rounded-md transition-colors ${
                        openCollapse === mod.id
                          ? "bg-[#e4fef1] text-[#11c99d]"
                          : "hover:bg-[#e4fef1] text-gray-700"
                      }`}
                    >
                      <span className="font-medium">{mod.name}</span>
                      {openCollapse === mod.id ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </button>

                    {/* Categorías */}
                    {openCollapse === mod.id && (
                      <div className="w-full mt-1 space-y-1 pl-3 border-l border-gray-100">
                        {mod.categories.map((cat) => (
                          <CategoryItem
                            key={`${mod.id}-${cat.id}`}
                            category={cat}
                            moduleId={mod.id}
                            baseKey={mod.id}
                            level={0}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
};
