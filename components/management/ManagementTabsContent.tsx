"use client";
import React, { useMemo, useEffect, useState } from "react";
import { FileText, Download, Lock } from "lucide-react";
import { useDocuments, useModules } from "@/queries/management";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomPdfViewer } from "@/components/common/custom-pdf-viewer";
import { DocumentFile } from "@/types/documents";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ManagementContentProps {
  activeModule: string | null;
  activeCategory: string | null;
  setActiveCategory?: (category: string) => void;
}

export const ManagementContent = ({
  activeModule,
  activeCategory,
  setActiveCategory,
}: ManagementContentProps) => {
  const { data: documents, isLoading, error } = useDocuments();
  const { data: modules } = useModules();
  const [viewingDocument, setViewingDocument] = useState<{
    id: number;
    fileUrl: string;
    fileName: string;
    isPrivate: boolean;
    allowDownload?: boolean;
  } | null>(null);
  const [showPrivateDialog, setShowPrivateDialog] = useState(false);

  // Función para verificar si un archivo es privado usando los campos de Drupal
  const checkFilePrivacy = (file: DocumentFile): boolean => {
    // Usar el campo field_is_confidential de Drupal para determinar si es privado
    return file.field_is_confidential === true;
  };

  // Debug: mostrar información de los documentos
  useEffect(() => {
    if (documents) {
      console.log("Documentos obtenidos:", documents.length);
      console.log("Documentos:", documents);
      if (documents.length > 0) {
        console.log("Primer documento:", documents[0]);
        console.log("Categoría activa:", activeCategory);
      }
    }
    if (error) {
      console.error("Error obteniendo documentos:", error);
    }
  }, [documents, error, activeCategory]);

  // TODOS LOS HOOKS DEBEN ESTAR AQUÍ, ANTES DE CUALQUIER RETURN CONDICIONAL

  // Obtener el módulo desde los documentos
  const moduleData = useMemo(() => {
    if (!activeModule || !documents) return null;
    const doc = documents.find(
      (d) => d.field_modulo?.drupal_internal__tid?.toString() === activeModule
    );
    return doc?.field_modulo
      ? {
          id: activeModule,
          name: doc.field_modulo.name || "Sin nombre",
        }
      : null;
  }, [documents, activeModule]);

  // Filtrar documentos por módulo y categoría
  const filteredDocuments = useMemo(() => {
    if (!documents || documents.length === 0) return [];

    let filtered = documents;

    // Filtrar solo documentos que tienen archivos válidos (con URL)
    filtered = filtered.filter((doc) => {
      if (!doc.field_file || doc.field_file.length === 0) return false;
      // Verificar que al menos un archivo tenga URL válida
      return doc.field_file.some((file) => file && file.url && file.url.trim() !== "");
    });

    // Filtrar por módulo si está seleccionado (usar el ID del módulo)
    if (activeModule) {
      const beforeModuleFilter = filtered.length;
      filtered = filtered.filter((doc) => {
        const moduleId = doc.field_modulo?.drupal_internal__tid?.toString();
        return moduleId === activeModule;
      });
      console.log(`Filtro por módulo ${activeModule}: ${beforeModuleFilter} -> ${filtered.length} documentos`);
    }

    // Si hay categoría activa, filtrar por categoría usando el ID
    if (activeCategory) {
      const beforeCategoryFilter = filtered.length;
      
      // Buscar el ID de la categoría desde los módulos
      let categoryId: number | null = null;
      
      if (modules && modules.length > 0) {
        // Función recursiva para buscar categoría en módulos y sus subáreas
        const findCategoryRecursive = (items: any[]): number | null => {
          for (const item of items) {
            // Si el item tiene el nombre de la categoría y tiene id, es la categoría buscada
            if (item.name === activeCategory && item.id) {
              return item.id;
            }
            
            // Buscar recursivamente en subáreas
            if (item.subareas && item.subareas.length > 0) {
              const found = findCategoryRecursive(item.subareas);
              if (found !== null) return found;
            }
          }
          return null;
        };
        
        // Buscar en todos los módulos
        for (const module of modules) {
          if (module.categories && module.categories.length > 0) {
            const foundId = findCategoryRecursive(module.categories);
            if (foundId !== null) {
              categoryId = foundId;
              break;
            }
          }
        }
      }
      
      // Filtrar por categoría usando el ID
      filtered = filtered.filter((doc) => {
        const docCategoryId = doc.field_module_category?.drupal_internal__tid;
        
        if (categoryId !== null && docCategoryId !== undefined) {
          // Comparar directamente por ID
          return docCategoryId === categoryId;
        } else {
          // Fallback a comparación por nombre si no encontramos el ID
          const categoryName = doc.field_module_category?.name;
          return categoryName === activeCategory;
        }
      });
      
      console.log(`Filtro por categoría "${activeCategory}" (ID: ${categoryId}): ${beforeCategoryFilter} -> ${filtered.length} documentos`);
      
      // Debug: mostrar información de los documentos filtrados
      if (filtered.length > 0) {
        console.log("Documentos filtrados:", filtered.map(d => ({
          title: d.title,
          category: d.field_module_category?.name,
          categoryId: d.field_module_category?.drupal_internal__tid,
          files: d.field_file?.length || 0
        })));
      } else {
        const moduleDocs = documents.filter(d => {
          const moduleId = d.field_modulo?.drupal_internal__tid?.toString();
          return moduleId === activeModule;
        });
        console.warn("No se encontraron documentos. Documentos del módulo antes del filtro de categoría:", 
          moduleDocs.map(d => ({
            title: d.title,
            category: d.field_module_category?.name,
            categoryId: d.field_module_category?.drupal_internal__tid
          }))
        );
        console.warn("Categorías disponibles en los documentos del módulo:", 
          [...new Set(moduleDocs.map(d => d.field_module_category?.name).filter(Boolean))]
        );
      }
    }

    return filtered;
  }, [documents, activeModule, activeCategory, modules]);

  // Agrupar documentos por categoría para mostrar estadísticas (solo del módulo activo)
  const documentsByCategory = useMemo(() => {
    if (!documents || !activeModule) return {};
    
    const grouped: Record<string, number> = {};
    documents.forEach((doc) => {
      // Solo contar documentos que tienen archivos válidos (con URL) y pertenecen al módulo activo
      const moduleId = doc.field_modulo?.drupal_internal__tid?.toString();
      const hasValidFiles = doc.field_file && doc.field_file.length > 0 && 
        doc.field_file.some((file) => file && file.url && file.url.trim() !== "");
      
      if (
        moduleId === activeModule &&
        doc.field_module_category?.name &&
        hasValidFiles
      ) {
        const catName = doc.field_module_category.name;
        grouped[catName] = (grouped[catName] || 0) + 1;
      }
    });
    
    return grouped;
  }, [documents, activeModule]);

  // AHORA SÍ PODEMOS HACER RETURNS CONDICIONALES

  // Función para obtener el ID numérico del documento de Drupal

  // Si no hay módulo seleccionado
  if (!activeModule) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 w-[50%] gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col p-2.5 border border-gray-200 rounded-lg"
            >
              <div className="flex items-start gap-2 mb-2">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3.5 w-3.5 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Si el módulo no existe o está cargando, mostrar skeleton
  if (!moduleData || isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 w-[50%] gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col p-2.5 border border-gray-200 rounded-lg"
            >
              <div className="flex items-start gap-2 mb-2">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3.5 w-3.5 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Si no hay categoría, mostrar skeleton mientras se auto-selecciona la primera categoría
  if (!activeCategory) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 w-[50%] gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col p-2.5 border border-gray-200 rounded-lg"
            >
              <div className="flex items-start gap-2 mb-2">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3.5 w-3.5 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Si hay categoría activa, mostramos los PDFs
  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="grid grid-cols-1 w-[50%] gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col p-2.5 border border-gray-200 rounded-lg"
            >
              <div className="flex items-start gap-2 mb-2">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3.5 w-3.5 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No hay documentos disponibles en esta categoría.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 w-[50%] gap-2">
          {filteredDocuments.map((doc) => {
            // Tomar el primer archivo válido del documento (que tenga URL)
            const file = doc.field_file?.find((f) => f && f.url && f.url.trim() !== "");
            
            if (!file || !file.url) return null;

            const isPDF = file.filemime === "application/pdf";
            // Usar drupal_internal__nid que es el ID numérico del nodo en Drupal
            const documentNumericId = doc.drupal_internal__nid;
            const canView = isPDF && documentNumericId !== undefined && documentNumericId !== null;

            const handleClick = async (e: React.MouseEvent) => {
              if (canView) {
                e.preventDefault();
                
                // Obtener la URL correcta del archivo
                let fileUrlToUse = file.url;
                
                // Si la URL es un endpoint de visualización (/document/view/{id}), 
                // necesitamos obtener la URL del stream del PDF desde el HTML usando nuestro endpoint API
                if (file.url.includes("/document/view/")) {
                  try {
                    const authData = localStorage.getItem("drupalAuthData");
                    const accessToken = authData
                      ? JSON.parse(authData).access_token
                      : localStorage.getItem("drupalAccessToken");

                    if (accessToken) {
                      // Usar nuestro endpoint API que obtiene el HTML y las cookies desde el servidor
                      const streamUrlResponse = await fetch(
                        `/api/document/get-stream-url?url=${encodeURIComponent(file.url)}&token=${encodeURIComponent(accessToken)}`
                      );

                      if (streamUrlResponse.ok) {
                        const data = await streamUrlResponse.json();
                        if (data.streamUrl) {
                          fileUrlToUse = data.streamUrl;
                          console.log("URL del stream obtenida desde el servidor:", fileUrlToUse);
                        } else {
                          // Si no se pudo obtener el stream URL, usar JSON:API como fallback
                          console.warn("No se pudo obtener la URL del stream, usando JSON:API");
                          if (file.id) {
                            const fileIdParts = file.id.split("--");
                            if (fileIdParts.length >= 3) {
                              const fileUuid = fileIdParts.slice(2).join("--");
                              fileUrlToUse = `https://backoffice.cofrem.com.co/jsonapi/file/file/${fileUuid}`;
                            }
                          }
                        }
                      } else {
                        // Si el endpoint devuelve Forbidden u otro error, intentar usar JSON:API directamente
                        const errorData = await streamUrlResponse.json().catch(() => ({}));
                        console.warn("Error al obtener URL del stream (puede ser archivo privado), usando JSON:API", errorData);
                        if (file.id) {
                          const fileIdParts = file.id.split("--");
                          if (fileIdParts.length >= 3) {
                            const fileUuid = fileIdParts.slice(2).join("--");
                            fileUrlToUse = `https://backoffice.cofrem.com.co/jsonapi/file/file/${fileUuid}`;
                          }
                        }
                      }
                    }
                  } catch (error) {
                    console.error("Error al obtener URL del stream:", error);
                    // Fallback: intentar usar JSON:API
                    if (file.id) {
                      const fileIdParts = file.id.split("--");
                      if (fileIdParts.length >= 3) {
                        const fileUuid = fileIdParts.slice(2).join("--");
                        fileUrlToUse = `https://backoffice.cofrem.com.co/jsonapi/file/file/${fileUuid}`;
                      }
                    }
                  }
                } else if (file.url.includes("/jsonapi/file/file/") && file.id) {
                  // Si ya es una URL JSON:API, usarla directamente
                  fileUrlToUse = file.url;
                }
                
                // Log para depuración
                console.log("Archivo seleccionado:", {
                  urlOriginal: file.url,
                  urlUsada: fileUrlToUse,
                  filename: file.filename,
                  filemime: file.filemime,
                  fileId: file.id,
                });
                
                // Verificar si el archivo es privado usando los campos de Drupal
                const isPrivate = checkFilePrivacy(file);
                
                // Permitir abrir el visor incluso si es privado (pero sin permitir descarga)
                // Solo abrir el visor si es PDF
                if (isPDF) {
                  setViewingDocument({
                    id: documentNumericId,
                    fileUrl: fileUrlToUse,
                    fileName: doc.title || file.filename || "documento.pdf",
                    isPrivate: isPrivate, // Marcar como privado para bloquear descarga
                    allowDownload: !isPrivate && file.field_allow_download !== false, // Solo permitir descarga si no es privado y field_allow_download no es false
                  });
                }
              }
              // Si no es PDF o no tiene ID válido, el link se comporta normalmente (descarga directa)
            };

            const isPrivateFile = checkFilePrivacy(file);
            const canDownloadFile = !isPrivateFile && file.field_allow_download !== false;

            return (
              <div
                key={doc.id}
                onClick={handleClick}
                className={`flex flex-col p-2.5 border rounded-lg transition-all group ${
                  isPrivateFile 
                    ? "border-gray-200 hover:bg-gray-50 cursor-not-allowed opacity-75" 
                    : "border-gray-200 hover:bg-[#e4fef1] hover:border-[#11c99d] cursor-pointer"
                }`}
              >
                <div className="flex items-start gap-2 mb-2">
                  <div className={`w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center ${
                    isPrivateFile 
                      ? "bg-gray-100" 
                      : "bg-[#11c99d]/10"
                  }`}>
                    {isPrivateFile ? (
                      <Lock className="h-4 w-4 text-gray-400" />
                    ) : (
                    <FileText className="h-4 w-4 text-[#11c99d]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-normal transition-colors line-clamp-2 ${
                      isPrivateFile 
                        ? "text-gray-500" 
                        : "text-gray-900 group-hover:text-[#2f8cbd]"
                    }`}>
                      {doc.title}
                    </h4>
                    {file.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                        {file.description}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {isPDF ? "PDF" : file.filemime.split("/")[1]?.toUpperCase() || "Archivo"}
                    </span>
                    {file.filesize > 0 && (
                      <span className="text-xs text-gray-400">
                        • {(file.filesize / 1024).toFixed(1)} KB
                      </span>
                    )}
                    {isPrivateFile && (
                      <span className="text-xs text-red-500 flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Privado
                      </span>
                    )}
                  </div>
                  {canDownloadFile && (
                  <Download className="h-3.5 w-3.5 text-[#2f8cbd] opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Visor de PDF personalizado */}
      {viewingDocument && (
        <CustomPdfViewer
          documentId={viewingDocument.id}
          fileUrl={viewingDocument.fileUrl}
          fileName={viewingDocument.fileName}
          isPrivate={viewingDocument.isPrivate}
          allowDownload={viewingDocument.allowDownload}
          onClose={() => setViewingDocument(null)}
        />
      )}

      {/* Diálogo para archivos privados */}
      <Dialog open={showPrivateDialog} onOpenChange={setShowPrivateDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Lock className="h-5 w-5 text-red-600" />
              </div>
              <DialogTitle>Documento Privado</DialogTitle>
            </div>
            <DialogDescription className="pt-2">
              Este documento es privado y no está disponible para visualización o descarga.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowPrivateDialog(false)}>
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
