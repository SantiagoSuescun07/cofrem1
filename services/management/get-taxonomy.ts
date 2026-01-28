import api from "@/lib/axios";

export interface TaxonomyCategory {
  id: number;
  name: string;
  uuid: string;
  drupal_internal__tid: number;
  subareas?: TaxonomyCategory[];
  parentId?: number | null;
  isChild?: boolean; // true si es un child (subárea), false si es una categoría real
}

export interface TaxonomyModule {
  id: number;
  name: string;
  uuid: string;
  drupal_internal__tid: number;
  categories: TaxonomyCategory[];
}

// Interfaz para la respuesta del nuevo endpoint
interface AreaSubareaItem {
  id: number;
  status: boolean;
  name: string;
  description: string | null;
  weight: number;
  created: string | null;
  changed: string;
  children: AreaSubareaItem[];
}

// Función recursiva para transformar children a subareas
const transformChildrenToSubareas = (children: AreaSubareaItem[]): TaxonomyCategory[] => {
  return children.map((child) => ({
    id: child.id,
    name: child.name,
    uuid: `area-${child.id}`, // Generar un UUID único
    drupal_internal__tid: child.id, // Usar el ID como drupal_internal__tid
    parentId: null, // Se establecerá en el proceso
    subareas: child.children && child.children.length > 0 
      ? transformChildrenToSubareas(child.children) 
      : undefined,
  }));
};

export const fetchModules = async (): Promise<TaxonomyModule[]> => {
  try {
    // Llamar al endpoint de módulos del sistema de gestión
    const { data } = await api.get("/factory-apis/taxonomy/modules_management_system", {
      auth: {
        username: "admin",
        password: "admin",
      },
    });

    if (!data || !Array.isArray(data)) {
      console.warn("No hay datos en la respuesta del endpoint");
      return [];
    }

    // Filtrar solo items activos (status: true)
    const activeItems = data.filter((item: any) => item.status === true);

    // Función recursiva para transformar children en subáreas con sus categorías
    const transformChildren = (children: any[], parentModuleId: number): TaxonomyCategory[] => {
      if (!children || children.length === 0) return [];
      
      return children.map((child) => {
        // Transformar field_categories del child en categorías reales
        const childCategories: TaxonomyCategory[] = child.field_categories && child.field_categories.length > 0
          ? child.field_categories.map((cat: any) => ({
              id: cat.id,
              name: cat.name,
              uuid: `cat-${cat.id}`,
              drupal_internal__tid: cat.id,
              parentId: parentModuleId, // El parentId es el módulo, no el child
              isChild: false, // Es una categoría real, no un child
            }))
          : [];

        // Procesar children anidados recursivamente
        const nestedChildren = child.children && child.children.length > 0
          ? transformChildren(child.children, parentModuleId)
          : [];

        // Crear la subárea (child) que contiene sus categorías y children anidados
        return {
          id: child.id,
          name: child.name,
          uuid: `area-${child.id}`,
          drupal_internal__tid: child.id,
          parentId: parentModuleId,
          isChild: true, // Es un child (subárea), no una categoría real
          // Las categorías del child van como subáreas, junto con los children anidados
          subareas: childCategories.length > 0 || nestedChildren.length > 0
            ? [...childCategories, ...nestedChildren]
            : undefined,
        };
      });
    };

    // Transformar cada item de nivel superior en un módulo
    const modules: TaxonomyModule[] = activeItems.map((item: any) => {
      // Las categorías vienen en field_categories del módulo principal
      const categories: TaxonomyCategory[] = item.field_categories && item.field_categories.length > 0
        ? item.field_categories.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            uuid: `cat-${cat.id}`,
            drupal_internal__tid: cat.id,
            parentId: item.id,
            isChild: false, // Es una categoría real, no un child
          }))
        : [];

      // Los children se convierten en subáreas (que pueden tener sus propias categorías)
      const subareas = item.children && item.children.length > 0
        ? transformChildren(item.children, item.id)
        : [];

      // Combinar categorías del módulo con las subáreas (children)
      // Las subáreas se muestran como categorías expandibles que contienen sus propias categorías
      const allCategories: TaxonomyCategory[] = [
        ...categories,
        ...subareas,
      ];

      return {
        id: item.id,
        name: item.name,
        uuid: `module-${item.id}`,
        drupal_internal__tid: item.id,
        categories: allCategories, // Categorías del módulo + subáreas (children)
      };
    });

    // Ordenar módulos por weight, luego por nombre
    modules.sort((a, b) => {
      const aItem = activeItems.find((item: any) => item.id === a.id);
      const bItem = activeItems.find((item: any) => item.id === b.id);
      const aWeight = aItem?.weight ?? 999;
      const bWeight = bItem?.weight ?? 999;
      
      if (aWeight !== bWeight) {
        return aWeight - bWeight;
      }
      return a.name.localeCompare(b.name);
    });

    // Ordenar categorías por nombre dentro de cada módulo
    modules.forEach((module) => {
      if (module.categories && module.categories.length > 0) {
        module.categories.sort((a, b) => a.name.localeCompare(b.name));
      }
    });

    return modules;
  } catch (error) {
    console.error("Error fetching modules:", error);
    return [];
  }
};


