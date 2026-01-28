"use client";

import { useState, useEffect, useRef } from "react";
import { X, ZoomIn, ZoomOut, Download, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Estilos CSS globales para prevenir el menú contextual
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    /* Prevenir menú contextual en todo el visor */
    .pdf-viewer-container * {
      -webkit-touch-callout: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      user-select: none !important;
    }
    
    /* Prevenir menú contextual específicamente */
    .pdf-viewer-container iframe {
      pointer-events: auto !important;
    }
  `;
  document.head.appendChild(style);
}

interface CustomPdfViewerProps {
  documentId: number;
  fileUrl: string;
  fileName: string;
  isPrivate?: boolean; // Si es true, no permitir descarga ni visualización
  allowDownload?: boolean; // Si es false, no permitir descarga (pero sí visualización)
  onClose: () => void;
}

export function CustomPdfViewer({
  documentId,
  fileUrl,
  fileName,
  isPrivate = false,
  allowDownload = true,
  onClose,
}: CustomPdfViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(100);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Verificar si el archivo es válido y cargar
  useEffect(() => {
    const checkAndLoad = async () => {
      try {
        setLoading(true);
        setError(null);

        // Los archivos privados se pueden visualizar pero no descargar
        // No bloquear la carga aquí, solo marcar que no se puede descargar

        // Obtener el access_token del localStorage
        const authData = localStorage.getItem("drupalAuthData");
        const accessToken = authData
          ? JSON.parse(authData).access_token
          : localStorage.getItem("drupalAccessToken");

        if (!accessToken) {
          setError("No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.");
          setLoading(false);
          return;
        }

        // Si la URL es un endpoint JSON:API, de stream de Drupal, o de nuestro proxy interno, 
        // el proxy lo manejará correctamente
        // No necesitamos verificar el content-type aquí porque el proxy lo hará
        const isJsonApiUrl = fileUrl.includes("/jsonapi/file/file/");
        const isStreamUrl = fileUrl.includes("/document/stream/");
        const isProxyStreamUrl = fileUrl.includes("/api/document/stream/");
        
        // Solo verificar content-type si NO es una URL JSON:API, de stream, de nuestro proxy, o de /document/view/
        // El proxy manejará todas estas URLs correctamente
        // Para archivos privados, no verificar content-type ya que pueden devolver diferentes respuestas
        const isDocumentViewUrl = fileUrl.includes("/document/view/");
        
        if (!isJsonApiUrl && !isStreamUrl && !isProxyStreamUrl && !isDocumentViewUrl && !isPrivate) {
          try {
            const checkResponse = await fetch(fileUrl, {
              method: "HEAD",
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            });

            const contentType = checkResponse.headers.get("content-type") || "";
            
            // Si es una imagen, es un archivo privado (pero permitir visualización si está marcado como privado)
            if (contentType.startsWith("image/") && !isPrivate) {
              setError("Este documento es privado y no está disponible para visualización.");
              setLoading(false);
              return;
            }

            // Si es HTML, probablemente es un endpoint de visualización
            if (contentType.includes("text/html") || contentType.includes("application/xhtml")) {
              setError("La URL proporcionada devuelve HTML en lugar de un PDF. Por favor, use la URL directa del archivo PDF.");
              setLoading(false);
              return;
            }

            // Si no es PDF y no es privado, mostrar error
            if (!contentType.includes("pdf") && !contentType.includes("application/pdf") && !isPrivate) {
              setError(`El archivo no es un PDF válido. Tipo de contenido recibido: ${contentType || "desconocido"}`);
              setLoading(false);
              return;
            }
          } catch (checkError) {
            // Si hay error al verificar content-type pero el archivo está marcado como privado, permitir continuar
            if (!isPrivate) {
              console.warn("Error al verificar content-type:", checkError);
            }
          }
        }

        // El iframe cargará el PDF automáticamente
        setLoading(false);
      } catch (err: any) {
        console.error("Error al verificar el archivo:", err);
        setError(err.message || "Error desconocido al cargar el documento");
        setLoading(false);
      }
    };

    // Solo ejecutar en el cliente
    if (typeof window !== "undefined") {
      checkAndLoad();
    }
  }, [fileUrl, isPrivate]);

  // Manejar carga del iframe
  const handleIframeLoad = () => {
    setLoading(false);
    
    // Prevenir descarga para archivos privados
    if (isPrivate && iframeRef.current?.contentDocument) {
      try {
        // Deshabilitar clic derecho y atajos de teclado
        const iframeDoc = iframeRef.current.contentDocument;
        iframeDoc.addEventListener("contextmenu", (e) => e.preventDefault());
        iframeDoc.addEventListener("keydown", (e) => {
          if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S" || e.key === "p" || e.key === "P")) {
            e.preventDefault();
          }
        });
      } catch (err) {
        // Ignorar errores de CORS
        console.warn("No se pudieron aplicar restricciones al iframe (CORS):", err);
      }
    }
  };

  // Manejar descarga (solo para archivos públicos y que permitan descarga)
  const handleDownload = async () => {
    if (isPrivate || !allowDownload) {
      alert("Este documento no permite descarga.");
      return; // No permitir descarga de archivos privados o que no permitan descarga
    }

    try {
      const authData = localStorage.getItem("drupalAuthData");
      const accessToken = authData
        ? JSON.parse(authData).access_token
        : localStorage.getItem("drupalAccessToken");

      if (!accessToken) {
        alert("No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.");
        return;
      }

      // Si la URL ya es una URL de nuestro proxy interno, usarla directamente
      let downloadUrl = fileUrl;
      
      // Si es una URL del proxy interno (/api/document/stream/), usarla directamente
      if (fileUrl.startsWith("/api/document/stream/")) {
        // La URL ya tiene el token y las cookies, usarla tal cual
        downloadUrl = fileUrl;
      } else if (fileUrl.includes("/document/stream/")) {
        // Si es una URL de stream de Drupal, construir la URL del proxy de stream
        const streamMatch = fileUrl.match(/\/document\/stream\/(\d+)\/([a-f0-9]+)/i);
        if (streamMatch) {
          const [, docId, hash] = streamMatch;
          // Intentar obtener cookies si están disponibles (aunque no son críticas para la descarga)
          downloadUrl = `/api/document/stream/${docId}/${hash}?token=${encodeURIComponent(accessToken)}`;
        }
      } else if (!fileUrl.startsWith("/api/")) {
        // Para otras URLs que no sean del proxy, usar el proxy de view-pdf
        downloadUrl = `/api/document/view-pdf?url=${encodeURIComponent(fileUrl)}&token=${encodeURIComponent(accessToken)}`;
      }

      console.log("Descargando desde:", downloadUrl);

      const response = await fetch(downloadUrl);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error al descargar:", response.status, response.statusText, errorText);
        throw new Error(`Error al descargar el archivo: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || "documento.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error al descargar:", err);
      alert(`Error al descargar el archivo: ${err instanceof Error ? err.message : "Error desconocido"}`);
    }
  };

  // Zoom
  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 25, 200));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 25, 50));
  };

  // Prevenir acciones no deseadas (clic derecho, atajos de teclado, etc.)
  useEffect(() => {
    const preventContextMenu = (e: MouseEvent) => {
      // Prevenir clic derecho siempre
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    };

    const preventMouseDown = (e: MouseEvent) => {
      // Interceptar clic derecho (button === 2) antes de que se dispare contextmenu
      if (e.button === 2) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    };

    const preventKeyShortcuts = (e: KeyboardEvent) => {
      // Prevenir Ctrl+S, Ctrl+P, Ctrl+Shift+I, F12, etc.
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "s" || e.key === "S" || e.key === "p" || e.key === "P" || e.key === "i" || e.key === "I" || e.key === "u" || e.key === "U")
      ) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
      // Prevenir F12 (DevTools)
      if (e.key === "F12" || (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C"))) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
      // Prevenir PrintScreen
      if (e.key === "PrintScreen") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    };

    const preventDragStart = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    };

    const preventSelectStart = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    };

    const preventCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    };

    // Aplicar todas las protecciones en fase de captura (true) para interceptar antes
    // Usar capture phase y passive: false para tener control total
    document.addEventListener("contextmenu", preventContextMenu, { capture: true, passive: false });
    document.addEventListener("mousedown", preventMouseDown, { capture: true, passive: false });
    document.addEventListener("mouseup", (e: MouseEvent) => {
      // También interceptar en mouseup para clic derecho
      if (e.button === 2) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    }, { capture: true, passive: false });
    document.addEventListener("keydown", preventKeyShortcuts, { capture: true, passive: false });
    document.addEventListener("dragstart", preventDragStart, { capture: true, passive: false });
    document.addEventListener("selectstart", preventSelectStart, { capture: true, passive: false });
    document.addEventListener("copy", preventCopy, { capture: true, passive: false });
    document.addEventListener("auxclick", (e: MouseEvent) => {
      // Prevenir clic con botón del medio
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }, { capture: true, passive: false });
    
    // Prevenir clic derecho también en el iframe si es posible
    const applyIframeProtections = () => {
      if (iframeRef.current) {
        try {
          const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
          if (iframeDoc) {
            iframeDoc.addEventListener("contextmenu", preventContextMenu, true);
            iframeDoc.addEventListener("mousedown", preventMouseDown, true);
            iframeDoc.addEventListener("keydown", preventKeyShortcuts, true);
            iframeDoc.addEventListener("dragstart", preventDragStart, true);
            iframeDoc.addEventListener("selectstart", preventSelectStart, true);
            iframeDoc.addEventListener("copy", preventCopy, true);
          }
        } catch (err) {
          // Ignorar errores de CORS
          console.warn("No se pudieron aplicar protecciones al iframe (CORS):", err);
        }
      }
    };

    // Aplicar protecciones al iframe cuando se carga
    applyIframeProtections();
    
    // Reintentar aplicar protecciones después de un delay (por si el iframe carga después)
    const timeoutId = setTimeout(applyIframeProtections, 1000);

    const preventMouseUp = (e: MouseEvent) => {
      if (e.button === 2) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    };

    const preventAuxClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    };

    document.addEventListener("mouseup", preventMouseUp, { capture: true, passive: false });
    document.addEventListener("auxclick", preventAuxClick, { capture: true, passive: false });

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("contextmenu", preventContextMenu, { capture: true } as any);
      document.removeEventListener("mousedown", preventMouseDown, { capture: true } as any);
      document.removeEventListener("mouseup", preventMouseUp, { capture: true } as any);
      document.removeEventListener("keydown", preventKeyShortcuts, { capture: true } as any);
      document.removeEventListener("dragstart", preventDragStart, { capture: true } as any);
      document.removeEventListener("selectstart", preventSelectStart, { capture: true } as any);
      document.removeEventListener("copy", preventCopy, { capture: true } as any);
      document.removeEventListener("auxclick", preventAuxClick, { capture: true } as any);
      
      if (iframeRef.current) {
        try {
          const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
          if (iframeDoc) {
            iframeDoc.removeEventListener("contextmenu", preventContextMenu, true);
            iframeDoc.removeEventListener("mousedown", preventMouseDown, true);
            iframeDoc.removeEventListener("keydown", preventKeyShortcuts, true);
            iframeDoc.removeEventListener("dragstart", preventDragStart, true);
            iframeDoc.removeEventListener("selectstart", preventSelectStart, true);
            iframeDoc.removeEventListener("copy", preventCopy, true);
          }
        } catch (err) {
          // Ignorar errores de CORS
        }
      }
    };
  }, [isPrivate]);

  // Obtener URL con token para el iframe usando nuestro proxy API
  const getIframeUrl = () => {
    // Si la URL ya es una URL de nuestro proxy interno (/api/document/stream/), usarla directamente
    if (fileUrl.startsWith("/api/document/stream/")) {
      return fileUrl;
    }

    const authData = localStorage.getItem("drupalAuthData");
    const accessToken = authData
      ? JSON.parse(authData).access_token
      : localStorage.getItem("drupalAccessToken");

    if (!accessToken) {
      return fileUrl; // Fallback a URL directa si no hay token
    }

    // Usar nuestro endpoint proxy que manejará la autenticación
    const proxyUrl = `/api/document/view-pdf?url=${encodeURIComponent(fileUrl)}&token=${encodeURIComponent(accessToken)}`;
    return proxyUrl;
  };

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Error</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={onClose} className="w-full">
            Cerrar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
      }}
    >
      <div className="bg-[#525659] rounded-lg shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col overflow-hidden">
        {/* Header con controles */}
        <div className="bg-gray-900 text-white px-4 py-3 flex justify-between items-center rounded-t-lg flex-shrink-0">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-sm truncate max-w-md">{fileName}</h3>
          </div>
          <div className="flex items-center gap-2">
            {/* Controles de zoom */}
            <Button
              variant="ghost"
              size="icon"
              onClick={zoomOut}
              disabled={scale <= 50}
              className="text-white hover:bg-gray-800 h-8 w-8"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs text-gray-400 min-w-[3rem] text-center">
              {scale}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={zoomIn}
              disabled={scale >= 200}
              className="text-white hover:bg-gray-800 h-8 w-8"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>

            {/* Botón de descarga (solo para archivos públicos y que permitan descarga) */}
            {!isPrivate && allowDownload && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                className="text-white hover:bg-gray-800 h-8 w-8"
                title="Descargar documento"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-gray-800 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Contenedor del PDF */}
        <div
          ref={containerRef}
          className="flex-1 w-full bg-[#525659] relative overflow-auto flex items-center justify-center"
          style={{ height: "calc(95vh - 60px)" }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (typeof (e.nativeEvent as any).stopImmediatePropagation === "function") {
              (e.nativeEvent as any).stopImmediatePropagation();
            }
            return false;
          }}
          onMouseDown={(e) => {
            // Interceptar clic derecho (button === 2)
            if (e.button === 2) {
              e.preventDefault();
              e.stopPropagation();
              if (typeof (e.nativeEvent as any).stopImmediatePropagation === "function") {
                (e.nativeEvent as any).stopImmediatePropagation();
              }
              return false;
            }
          }}
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-[#11c99d]" />
                <p className="text-gray-600">Cargando documento...</p>
              </div>
            </div>
          )}

          {/* Overlay transparente para capturar SOLO eventos de clic derecho */}
          <div
            className="absolute inset-0 z-20"
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (typeof (e.nativeEvent as any).stopImmediatePropagation === "function") {
                (e.nativeEvent as any).stopImmediatePropagation();
              }
              return false;
            }}
            onMouseDown={(e) => {
              // Solo interceptar clic derecho (button === 2)
              if (e.button === 2) {
                e.preventDefault();
                e.stopPropagation();
                if (typeof (e.nativeEvent as any).stopImmediatePropagation === "function") {
                  (e.nativeEvent as any).stopImmediatePropagation();
                }
                return false;
              }
              // Para otros eventos (incluyendo clic izquierdo y scroll), no hacer nada
            }}
            onMouseUp={(e) => {
              // Solo interceptar clic derecho en mouseUp
              if (e.button === 2) {
                e.preventDefault();
                e.stopPropagation();
                if (typeof (e.nativeEvent as any).stopImmediatePropagation === "function") {
                  (e.nativeEvent as any).stopImmediatePropagation();
                }
                return false;
              }
            }}
            onAuxClick={(e) => {
              // Prevenir clic con botón del medio u otros botones del mouse
              e.preventDefault();
              e.stopPropagation();
              if (typeof (e.nativeEvent as any).stopImmediatePropagation === "function") {
                (e.nativeEvent as any).stopImmediatePropagation();
              }
              return false;
            }}
            style={{
              pointerEvents: "none", // No bloquear eventos normales (scroll, clic izquierdo, etc.)
              userSelect: "none",
              WebkitUserSelect: "none",
              MozUserSelect: "none",
              msUserSelect: "none",
              WebkitTouchCallout: "none", // Prevenir menú contextual en iOS
            }}
            onPointerDown={(e) => {
              // Solo activar pointer-events cuando sea clic derecho
              if (e.button === 2) {
                const target = e.currentTarget as HTMLElement;
                target.style.pointerEvents = "auto";
                e.preventDefault();
                e.stopPropagation();
                if (typeof (e.nativeEvent as any).stopImmediatePropagation === "function") {
                  (e.nativeEvent as any).stopImmediatePropagation();
                }
                setTimeout(() => {
                  target.style.pointerEvents = "none";
                }, 100);
                return false;
              }
            }}
          />

          <iframe
            ref={iframeRef}
            src={`${getIframeUrl()}#toolbar=${isPrivate ? 0 : 1}&navpanes=${isPrivate ? 0 : 1}&scrollbar=1&zoom=${scale}`}
            className="w-full h-full border-0 relative z-10"
            style={{
              minHeight: "100%",
              userSelect: "none",
              WebkitUserSelect: "none",
              MozUserSelect: "none",
              msUserSelect: "none",
              WebkitTouchCallout: "none", // Prevenir menú contextual en iOS
            }}
            onLoad={handleIframeLoad}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (typeof (e.nativeEvent as any).stopImmediatePropagation === "function") {
                (e.nativeEvent as any).stopImmediatePropagation();
              }
              return false;
            }}
            onMouseDown={(e) => {
              // Interceptar TODOS los eventos excepto clic izquierdo
              if (e.button !== 0) {
                e.preventDefault();
                e.stopPropagation();
                if (typeof (e.nativeEvent as any).stopImmediatePropagation === "function") {
                  (e.nativeEvent as any).stopImmediatePropagation();
                }
                return false;
              }
            }}
            onMouseUp={(e) => {
              // Interceptar también en mouseUp para clic derecho
              if (e.button !== 0) {
                e.preventDefault();
                e.stopPropagation();
                if (typeof (e.nativeEvent as any).stopImmediatePropagation === "function") {
                  (e.nativeEvent as any).stopImmediatePropagation();
                }
                return false;
              }
            }}
            onAuxClick={(e) => {
              // Prevenir clic con botón del medio u otros botones del mouse
              e.preventDefault();
              e.stopPropagation();
              if (typeof (e.nativeEvent as any).stopImmediatePropagation === "function") {
                (e.nativeEvent as any).stopImmediatePropagation();
              }
              return false;
            }}
            title={fileName}
          />
        </div>
      </div>
    </div>
  );
}
