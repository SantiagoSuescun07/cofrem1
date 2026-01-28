import { apiBaseUrl } from "@/constants";
import api from "@/lib/axios";
import { Document, DocumentFile } from "@/types/documents";

export const fetchDocuments = async (): Promise<Document[]> => {
  // Variables que necesitamos en el catch
  const allDocuments: any[] = [];
  const allIncluded = new Map<string, any>();
  
  try {
    let page = 0;
    const pageSize = 50; // Drupal JSON:API límite por defecto

    // Función auxiliar para hacer una petición
    // Intentar primero con include, si falla, intentar sin include
    const makeRequest = async (params: any) => {
      try {
        return await api.get("/jsonapi/node/documents", { params });
      } catch (error: any) {
        if (error.response?.status === 400 && params.include) {
          // Si falla con include, intentar sin include
          const paramsWithoutInclude = { ...params };
          delete paramsWithoutInclude.include;
          try {
            return await api.get("/jsonapi/node/documents", { params: paramsWithoutInclude });
          } catch (retryError: any) {
            // Si también falla sin include, lanzar el error original
            throw error;
          }
        }
        throw error;
      }
    };

    // Primera petición - intentar con include, pero si falla, continuar sin include
    let response;
    let useInclude = true; // Rastrear si debemos usar include en peticiones siguientes
    try {
      response = await makeRequest({
        include: "field_file,field_icon,field_module_category,field_modulo",
        "page[limit]": pageSize,
        "page[offset]": 0,
      });
    } catch (error: any) {
      // Si falla con include, intentar sin include
      if (error.response?.status === 400) {
        console.warn("El servidor no acepta el parámetro include. Obteniendo documentos sin datos relacionados incluidos.");
        useInclude = false;
        response = await api.get("/jsonapi/node/documents", {
          params: {
            "page[limit]": pageSize,
            "page[offset]": 0,
          },
        });
      } else {
        throw error;
      }
    }

    // Procesar primera página
    let data = response.data;
    
    // Validar que tenemos una respuesta válida
    if (!data || typeof data !== 'object') {
      console.warn("Respuesta inválida del servidor:", data);
      return [];
    }
    
    allDocuments.push(...(data.data || []));
    
    // Agregar included a nuestro mapa (puede no estar presente)
    if (data.included && Array.isArray(data.included)) {
      data.included.forEach((included: any) => {
        if (included.id) {
          allIncluded.set(included.id, included);
        }
      });
    } else {
      console.warn("La respuesta no incluye datos relacionados (included). Los documentos se mostrarán sin archivos/categorías resueltas.");
    }

    // Obtener el total de documentos del meta count
    const totalCount = data.meta?.count || allDocuments.length;

    // Continuar obteniendo páginas mientras haya más datos
    while (allDocuments.length < totalCount) {
      page++;
      const offset = page * pageSize;

      // Si ya tenemos todos los documentos, salir
      if (allDocuments.length >= totalCount) {
        break;
      }

      try {
        const pageParams: any = {
          "page[limit]": pageSize,
          "page[offset]": offset,
        };
        
        // Solo agregar include si sabemos que funciona
        if (useInclude) {
          pageParams.include = "field_file,field_icon,field_module_category,field_modulo";
        }
        
        response = await makeRequest(pageParams);

        data = response.data;
        
        if (data.data && data.data.length > 0) {
          allDocuments.push(...data.data);
          
          // Agregar nuevos included al mapa
          if (data.included && Array.isArray(data.included)) {
            data.included.forEach((included: any) => {
              if (included.id) {
                allIncluded.set(included.id, included);
              }
            });
          }

          // Actualizar el total count si está disponible
          const currentTotal = data.meta?.count || totalCount;
          if (currentTotal > totalCount) {
            // Si el total count cambió, actualizarlo
            // (esto no debería pasar, pero por si acaso)
          }

          // Si la respuesta trajo menos documentos que el pageSize, ya no hay más páginas
          if (data.data.length < pageSize) {
            break; // Ya obtuvimos todos los documentos disponibles
          }
        } else {
          break; // No hay más datos
        }
      } catch (pageError: any) {
        console.warn(`Error obteniendo página ${page}:`, pageError);
        break; // Detener si hay error en una página
      }
    }

    console.log(`Total documentos obtenidos: ${allDocuments.length}`);
    console.log(`Total included items: ${allIncluded.size}`);

    // Si no hay included, obtener los archivos desde las URLs de relaciones
    // Envolver en try-catch para que los errores no se propaguen
    if (allIncluded.size === 0) {
      try {
        console.log("No hay datos incluidos, obteniendo archivos desde URLs de relaciones...");
        
        // Recopilar todas las URLs de archivos que necesitamos obtener
        // Cada documento tiene su propia URL de relación para obtener sus archivos
        const documentFileUrls: Array<{ 
          documentId: string; 
          url: string; 
          fileRefs: Array<{ id: string; meta?: any }> 
        }> = [];
        
        allDocuments.forEach((item: any) => {
          const fileData = item.relationships?.field_field_file?.data;
          const relatedUrl = item.relationships?.field_field_file?.links?.related?.href;
          
          if (fileData && relatedUrl) {
            const fileArray = Array.isArray(fileData) ? fileData : [fileData];
            const fileRefs = fileArray
              .filter((fileRef: any) => fileRef?.id)
              .map((fileRef: any) => ({ id: fileRef.id, meta: fileRef.meta }));
            
            if (fileRefs.length > 0) {
              documentFileUrls.push({
                documentId: item.id,
                url: relatedUrl,
                fileRefs,
              });
            }
          }
        });

        // Hacer peticiones en paralelo para obtener los archivos de cada documento
        if (documentFileUrls.length > 0) {
          console.log(`Obteniendo archivos para ${documentFileUrls.length} documentos...`);
          
          const filePromises = documentFileUrls.map(async ({ documentId, url, fileRefs }) => {
            try {
              // Extraer la ruta relativa de la URL (puede ser absoluta o relativa)
              let path = url;
              try {
                // Si es una URL absoluta, extraer solo la ruta
                const urlObj = new URL(url);
                path = urlObj.pathname + urlObj.search;
              } catch {
                // Si falla, asumir que ya es una ruta relativa
                path = url.startsWith('/') ? url : `/${url}`;
              }
              
              const fileResponse = await api.get(path);
              const fileData = fileResponse.data;
              
              // El formato puede ser un objeto data o un array data
              if (fileData?.data) {
                const files = Array.isArray(fileData.data) ? fileData.data : [fileData.data];
                
                // Mapear cada archivo con su referencia correspondiente
                files.forEach((file: any, index: number) => {
                  if (file?.id) {
                    const fileRef = fileRefs[index] || fileRefs.find(fr => fr.id === file.id);
                    allIncluded.set(file.id, { 
                      ...file, 
                      _meta: fileRef?.meta,
                      _documentId: documentId 
                    });
                  }
                });
              }
            } catch (fileError: any) {
              // Silenciar errores de peticiones individuales de archivos
              // Solo loguear como debug, no como error
              if (process.env.NODE_ENV === 'development') {
                console.debug(`No se pudo obtener archivo para documento ${documentId}:`, fileError.message);
              }
            }
          });

          await Promise.allSettled(filePromises);
          console.log(`Archivos obtenidos: ${allIncluded.size}`);
        }

        // También obtener categorías y módulos si no están en included
        const categoryUrls: Array<{ id: string; url: string }> = [];
        const moduleUrls: Array<{ id: string; url: string }> = [];

        allDocuments.forEach((item: any) => {
          const categoryData = item.relationships?.field_module_category?.data;
          const categoryUrl = item.relationships?.field_module_category?.links?.related?.href;
          if (categoryData?.id && categoryUrl && !allIncluded.has(categoryData.id)) {
            categoryUrls.push({ id: categoryData.id, url: categoryUrl });
          }

          const moduleData = item.relationships?.field_modulo?.data;
          const moduleUrl = item.relationships?.field_modulo?.links?.related?.href;
          if (moduleData?.id && moduleUrl && !allIncluded.has(moduleData.id)) {
            moduleUrls.push({ id: moduleData.id, url: moduleUrl });
          }
        });

        // Obtener categorías y módulos en paralelo
        const categoryPromises = categoryUrls.map(async ({ id, url }) => {
          try {
            let path = url;
            try {
              const urlObj = new URL(url);
              path = urlObj.pathname + urlObj.search;
            } catch {
              path = url.startsWith('/') ? url : `/${url}`;
            }
            const response = await api.get(path);
            if (response.data?.data) {
              const category = Array.isArray(response.data.data) ? response.data.data[0] : response.data.data;
              if (category?.id) {
                allIncluded.set(category.id, category);
              }
            }
          } catch (error: any) {
            // Silenciar errores individuales
            if (process.env.NODE_ENV === 'development') {
              console.debug(`No se pudo obtener categoría ${id}:`, error.message);
            }
          }
        });

        const modulePromises = moduleUrls.map(async ({ id, url }) => {
          try {
            let path = url;
            try {
              const urlObj = new URL(url);
              path = urlObj.pathname + urlObj.search;
            } catch {
              path = url.startsWith('/') ? url : `/${url}`;
            }
            const response = await api.get(path);
            if (response.data?.data) {
              const module = Array.isArray(response.data.data) ? response.data.data[0] : response.data.data;
              if (module?.id) {
                allIncluded.set(module.id, module);
              }
            }
          } catch (error: any) {
            // Silenciar errores individuales
            if (process.env.NODE_ENV === 'development') {
              console.debug(`No se pudo obtener módulo ${id}:`, error.message);
            }
          }
        });

        await Promise.allSettled([...categoryPromises, ...modulePromises]);
        console.log(`Total items incluidos después de peticiones adicionales: ${allIncluded.size}`);
      } catch (relatedDataError: any) {
        // Si hay un error al obtener datos relacionados, solo mostrar warning
        // No propagar el error para que los documentos principales se puedan procesar
        console.warn("Error al obtener datos relacionados (archivos, categorías, módulos):", relatedDataError.message);
      }
    }

    // Usar el mapa consolidado de included para procesar todos los documentos
    const includedById = allIncluded;

    // Validar que tenemos datos
    if (!allDocuments || allDocuments.length === 0) {
      console.warn("No hay datos en la respuesta de documentos");
      return [];
    }

  const documents: Document[] = allDocuments.map((item: any) => {
    // Resolver field_file (puede ser un array)
    // Nota: El campo en las relaciones es field_field_file según el JSON:API de Drupal
    const fileData = item.relationships?.field_field_file?.data || item.relationships?.field_file?.data;
    const fieldFile: DocumentFile[] = [];
    
    if (fileData) {
      const fileArray = Array.isArray(fileData) ? fileData : [fileData];
      
      fileArray.forEach((fileRef: any) => {
        if (!fileRef?.id) return;
        
        const fileIncluded = includedById.get(fileRef.id);
        if (fileIncluded && fileIncluded.attributes) {
          const uri = fileIncluded.attributes.uri?.url;
          if (uri) {
            // Usar los metadatos guardados o los del fileRef
            const meta = fileIncluded._meta || fileRef.meta;
            fieldFile.push({
              id: fileIncluded.id,
              filename: fileIncluded.attributes.filename || "",
              url: apiBaseUrl + uri,
              filemime: fileIncluded.attributes.filemime || "",
              filesize: fileIncluded.attributes.filesize || 0,
              description: meta?.description || undefined,
              field_is_confidential: fileIncluded.attributes.field_is_confidential || false,
              field_allow_download: fileIncluded.attributes.field_allow_download !== undefined 
                ? fileIncluded.attributes.field_allow_download 
                : true, // Por defecto permitir descarga si no está especificado
            });
          }
        }
        // Si no está en included, simplemente no lo agregamos (no es un error crítico)
      });
    }

    // Resolver field_icon
    const iconData = item.relationships?.field_icon?.data;
    let fieldIcon = null;
    if (iconData) {
      const iconIncluded = includedById.get(iconData.id);
      if (iconIncluded?.attributes?.uri?.url) {
        fieldIcon = {
          id: iconIncluded.id,
          url: apiBaseUrl + iconIncluded.attributes.uri.url,
          alt: iconData.meta?.alt || "",
          title: iconData.meta?.title || "",
          width: iconData.meta?.width || 0,
          height: iconData.meta?.height || 0,
        };
      }
    }

    // Resolver field_module_category
    const categoryData = item.relationships?.field_module_category?.data;
    let fieldModuleCategory = null;
    if (categoryData) {
      const categoryIncluded = includedById.get(categoryData.id);
      if (categoryIncluded?.attributes) {
        fieldModuleCategory = {
          id: categoryIncluded.id,
          name: categoryIncluded.attributes.name || "",
          drupal_internal__tid:
            categoryIncluded.attributes.drupal_internal__tid || 0,
        };
      }
    }

    // Resolver field_modulo
    const moduleData = item.relationships?.field_modulo?.data;
    let fieldModulo = null;
    if (moduleData) {
      const moduleIncluded = includedById.get(moduleData.id);
      if (moduleIncluded?.attributes) {
        fieldModulo = {
          id: moduleIncluded.id,
          name: moduleIncluded.attributes.name || undefined,
          drupal_internal__tid:
            moduleIncluded.attributes.drupal_internal__tid || 0,
        };
      }
    }

    return {
      id: item.id,
      drupal_internal__nid: item.attributes.drupal_internal__nid || 0,
      title: item.attributes.title || "",
      created: item.attributes.created || "",
      changed: item.attributes.changed || "",
      field_file: fieldFile,
      field_icon: fieldIcon,
      field_module_category: fieldModuleCategory,
      field_modulo: fieldModulo,
    };
  });

  // Filtrar documentos que no tienen datos válidos
  const validDocuments = documents.filter((doc) => {
    return doc.id && doc.title;
  });

  return validDocuments;
  } catch (error: any) {
    // Manejo detallado de errores
    // Solo mostrar errores críticos que impiden obtener los documentos principales
    
    // Verificar si el error es de una petición de datos relacionados
    const isRelatedDataRequest = error.config?.url?.includes('/field_field_file') ||
                                 error.config?.url?.includes('/field_module_category') ||
                                 error.config?.url?.includes('/field_modulo');
    
    // Si es un error de datos relacionados, solo mostrar warning y continuar
    if (isRelatedDataRequest) {
      console.warn("Error al obtener datos relacionados:", {
        url: error.config?.url,
        message: error.message,
        status: error.response?.status,
      });
      // Continuar procesando los documentos principales aunque falten datos relacionados
      if (allDocuments && allDocuments.length > 0) {
        // Procesar documentos sin datos relacionados
        const includedById = allIncluded;
        const documents: Document[] = allDocuments.map((item: any) => {
          const fileData = item.relationships?.field_field_file?.data || item.relationships?.field_file?.data;
          const fieldFile: DocumentFile[] = [];
          
          if (fileData) {
            const fileArray = Array.isArray(fileData) ? fileData : [fileData];
            fileArray.forEach((fileRef: any) => {
              if (!fileRef?.id) return;
              const fileIncluded = includedById.get(fileRef.id);
              if (fileIncluded && fileIncluded.attributes) {
                const uri = fileIncluded.attributes.uri?.url;
                if (uri) {
                  const meta = fileIncluded._meta || fileRef.meta;
                  fieldFile.push({
                    id: fileIncluded.id,
                    filename: fileIncluded.attributes.filename || "",
                    url: apiBaseUrl + uri,
                    filemime: fileIncluded.attributes.filemime || "",
                    filesize: fileIncluded.attributes.filesize || 0,
                    description: meta?.description || undefined,
                    field_is_confidential: fileIncluded.attributes.field_is_confidential || false,
                    field_allow_download: fileIncluded.attributes.field_allow_download !== undefined 
                      ? fileIncluded.attributes.field_allow_download 
                      : true,
                  });
                }
              }
            });
          }

          const iconData = item.relationships?.field_icon?.data;
          let fieldIcon = null;
          if (iconData) {
            const iconIncluded = includedById.get(iconData.id);
            if (iconIncluded?.attributes?.uri?.url) {
              fieldIcon = {
                id: iconIncluded.id,
                url: apiBaseUrl + iconIncluded.attributes.uri.url,
                alt: iconData.meta?.alt || "",
                title: iconData.meta?.title || "",
                width: iconData.meta?.width || 0,
                height: iconData.meta?.height || 0,
              };
            }
          }

          const categoryData = item.relationships?.field_module_category?.data;
          let fieldModuleCategory = null;
          if (categoryData) {
            const categoryIncluded = includedById.get(categoryData.id);
            if (categoryIncluded?.attributes) {
              fieldModuleCategory = {
                id: categoryIncluded.id,
                name: categoryIncluded.attributes.name || "",
                drupal_internal__tid: categoryIncluded.attributes.drupal_internal__tid || 0,
              };
            }
          }

          const moduleData = item.relationships?.field_modulo?.data;
          let fieldModulo = null;
          if (moduleData) {
            const moduleIncluded = includedById.get(moduleData.id);
            if (moduleIncluded?.attributes) {
              fieldModulo = {
                id: moduleIncluded.id,
                name: moduleIncluded.attributes.name || undefined,
                drupal_internal__tid: moduleIncluded.attributes.drupal_internal__tid || 0,
              };
            }
          }

          return {
            id: item.id,
            drupal_internal__nid: item.attributes.drupal_internal__nid || 0,
            title: item.attributes.title || "",
            created: item.attributes.created || "",
            changed: item.attributes.changed || "",
            field_file: fieldFile,
            field_icon: fieldIcon,
            field_module_category: fieldModuleCategory,
            field_modulo: fieldModulo,
          };
        });

        return documents.filter((doc) => doc.id && doc.title);
      }
      return [];
    }
    
    // Si no es un error de datos relacionados, es un error crítico de la petición principal
    if (error.response) {
      const status = error.response.status;
      const statusText = error.response.statusText;
      const errorData = error.response.data;
      const requestUrl = error.config?.url || '';
      const requestParams = error.config?.params || {};
      
      // Verificar si el error es por el parámetro include (400 con include en params)
      const isIncludeError = status === 400 && requestParams.include;
      
      if (status >= 400) {
        // Si es un error 400 relacionado con include, ya lo manejamos arriba, no mostrar error
        if (isIncludeError) {
          console.warn("El servidor no acepta el parámetro include. Los datos relacionados se obtendrán por separado.");
          // Si ya tenemos documentos, retornarlos
          if (allDocuments && allDocuments.length > 0) {
            // Procesar documentos sin datos relacionados
            const includedById = allIncluded;
            const documents: Document[] = allDocuments.map((item: any) => {
              const fileData = item.relationships?.field_field_file?.data || item.relationships?.field_file?.data;
              const fieldFile: DocumentFile[] = [];
              
              if (fileData) {
                const fileArray = Array.isArray(fileData) ? fileData : [fileData];
                fileArray.forEach((fileRef: any) => {
                  if (!fileRef?.id) return;
                  const fileIncluded = includedById.get(fileRef.id);
                  if (fileIncluded && fileIncluded.attributes) {
                    const uri = fileIncluded.attributes.uri?.url;
                    if (uri) {
                      const meta = fileIncluded._meta || fileRef.meta;
                      fieldFile.push({
                        id: fileIncluded.id,
                        filename: fileIncluded.attributes.filename || "",
                        url: apiBaseUrl + uri,
                        filemime: fileIncluded.attributes.filemime || "",
                        filesize: fileIncluded.attributes.filesize || 0,
                        description: meta?.description || undefined,
                    field_is_confidential: fileIncluded.attributes.field_is_confidential || false,
                    field_allow_download: fileIncluded.attributes.field_allow_download !== undefined 
                      ? fileIncluded.attributes.field_allow_download 
                      : true,
                      });
                    }
                  }
                });
              }

              const iconData = item.relationships?.field_icon?.data;
              let fieldIcon = null;
              if (iconData) {
                const iconIncluded = includedById.get(iconData.id);
                if (iconIncluded?.attributes?.uri?.url) {
                  fieldIcon = {
                    id: iconIncluded.id,
                    url: apiBaseUrl + iconIncluded.attributes.uri.url,
                    alt: iconData.meta?.alt || "",
                    title: iconData.meta?.title || "",
                    width: iconData.meta?.width || 0,
                    height: iconData.meta?.height || 0,
                  };
                }
              }

              const categoryData = item.relationships?.field_module_category?.data;
              let fieldModuleCategory = null;
              if (categoryData) {
                const categoryIncluded = includedById.get(categoryData.id);
                if (categoryIncluded?.attributes) {
                  fieldModuleCategory = {
                    id: categoryIncluded.id,
                    name: categoryIncluded.attributes.name || "",
                    drupal_internal__tid: categoryIncluded.attributes.drupal_internal__tid || 0,
                  };
                }
              }

              const moduleData = item.relationships?.field_modulo?.data;
              let fieldModulo = null;
              if (moduleData) {
                const moduleIncluded = includedById.get(moduleData.id);
                if (moduleIncluded?.attributes) {
                  fieldModulo = {
                    id: moduleIncluded.id,
                    name: moduleIncluded.attributes.name || undefined,
                    drupal_internal__tid: moduleIncluded.attributes.drupal_internal__tid || 0,
                  };
                }
              }

              return {
                id: item.id,
                drupal_internal__nid: item.attributes.drupal_internal__nid || 0,
                title: item.attributes.title || "",
                created: item.attributes.created || "",
                changed: item.attributes.changed || "",
                field_file: fieldFile,
                field_icon: fieldIcon,
                field_module_category: fieldModuleCategory,
                field_modulo: fieldModulo,
              };
            });

            return documents.filter((doc) => doc.id && doc.title);
          }
          return [];
        }
        
        // Para otros errores, mostrar el error
        console.error("Error fetching documents - Respuesta del servidor:", {
          status,
          statusText,
          url: requestUrl,
          params: requestParams,
          errorData: errorData || "Sin datos de error",
        });

        if (status === 400 || status === 404) {
          console.warn("El endpoint de documentos no está disponible o los parámetros son inválidos. Retornando array vacío.");
          return [];
        }
      }
    } else if (error.request) {
      console.error("Error fetching documents - No se recibió respuesta del servidor:", error.request);
    } else {
      console.error("Error fetching documents - Error en la configuración:", error.message);
    }
    
    
    // En cualquier otro caso, retornar array vacío
    return [];
  }
};

