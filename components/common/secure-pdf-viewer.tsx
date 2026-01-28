"use client";

import { useState, useEffect, useRef } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SecurePdfViewerProps {
  documentId: number;
  onClose: () => void;
}

export function SecurePdfViewer({ documentId, onClose }: SecurePdfViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerHtml, setViewerHtml] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadViewer = async () => {
      try {
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

        console.log("🔑 Usando access_token para documento:", documentId);

        // Usar nuestro proxy que agregará el token y modificará los iframes
        const viewResponse = await fetch(
          `/api/document/view/${documentId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "text/html",
            },
          }
        );

        if (!viewResponse.ok) {
          throw new Error(`Error al cargar el documento: ${viewResponse.statusText} (${viewResponse.status})`);
        }

        // Obtener el HTML completo (ya procesado por el proxy)
        let html = await viewResponse.text();
        
        console.log("📄 HTML recibido del servidor, listo para inyectar");
        
        // Agregar protección adicional al HTML para prevenir clic derecho y descarga
        // Inyectar script de protección antes del cierre del body
        const protectionScript = `
          <script>
            (function() {
              // Prevenir clic derecho
              document.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                return false;
              }, false);
              
              // Prevenir atajos de teclado
              document.addEventListener('keydown', function(e) {
                // Prevenir Ctrl+S, Ctrl+P, Ctrl+A, etc.
                if ((e.ctrlKey || e.metaKey) && 
                    (e.key === 's' || e.key === 'S' || 
                     e.key === 'p' || e.key === 'P' ||
                     e.key === 'a' || e.key === 'A')) {
                  e.preventDefault();
                  return false;
                }
                // Prevenir F12
                if (e.key === 'F12') {
                  e.preventDefault();
                  return false;
                }
              }, false);
              
              // Prevenir selección de texto
              document.addEventListener('selectstart', function(e) {
                e.preventDefault();
                return false;
              }, false);
              
              // Prevenir arrastre
              document.addEventListener('dragstart', function(e) {
                e.preventDefault();
                return false;
              }, false);
              
              // Protección en iframes
              window.addEventListener('load', function() {
                const iframe = document.querySelector('iframe#secure-pdf-iframe');
                if (iframe && iframe.contentDocument) {
                  iframe.contentDocument.addEventListener('contextmenu', function(e) {
                    e.preventDefault();
                    return false;
                  }, false);
                }
              });
            })();
          </script>
        `;
        
        // Insertar el script antes del cierre del </body>
        html = html.replace('</body>', protectionScript + '</body>');
        
        // También agregar estilos para deshabilitar selección
        const protectionStyles = `
          <style>
            * {
              -webkit-user-select: none !important;
              -moz-user-select: none !important;
              -ms-user-select: none !important;
              user-select: none !important;
              -webkit-touch-callout: none !important;
            }
            iframe {
              pointer-events: auto;
            }
          </style>
        `;
        
        // Insertar estilos en el head
        html = html.replace('</head>', protectionStyles + '</head>');
        
        // El proxy ya ha modificado el HTML para usar nuestro proxy de stream
        // Ahora también tiene protección adicional
        setViewerHtml(html);
        setLoading(false);
        
        // Esperar a que el iframe interno se cargue y agregar listeners
        setTimeout(() => {
          const innerIframe = containerRef.current?.querySelector("iframe#secure-pdf-iframe") as HTMLIFrameElement;
          if (innerIframe) {
            console.log("🔍 Iframe encontrado, src:", innerIframe.src);
            innerIframe.onload = () => {
              console.log("✅ PDF cargado correctamente");
            };
            innerIframe.onerror = () => {
              console.error("❌ Error al cargar el PDF en el iframe interno");
            };
          } else {
            console.warn("⚠️ No se encontró el iframe después de inyectar el HTML");
          }
        }, 200);
      } catch (err) {
        console.error("❌ Error al cargar el visor:", err);
        setError(err instanceof Error ? err.message : "Error desconocido al cargar el documento");
        setLoading(false);
      }
    };

    loadViewer();
  }, [documentId]);

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
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

  // Prevenir clic derecho y otras acciones
  useEffect(() => {
    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const preventKeyShortcuts = (e: KeyboardEvent) => {
      // Prevenir Ctrl+S, Ctrl+P, F12, etc.
      if (
        (e.ctrlKey || e.metaKey) && 
        (e.key === 's' || e.key === 'S' || e.key === 'p' || e.key === 'P')
      ) {
        e.preventDefault();
        return false;
      }
      // Prevenir F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }
    };

    const preventDrag = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // Agregar listeners al documento cuando el visor está abierto
    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('keydown', preventKeyShortcuts);
    document.addEventListener('dragstart', preventDrag);
    document.addEventListener('selectstart', (e) => e.preventDefault());

    // También agregar al contenedor cuando se carga el HTML
    if (containerRef.current) {
      containerRef.current.addEventListener('contextmenu', preventContextMenu);
      containerRef.current.addEventListener('selectstart', (e) => e.preventDefault());
    }

    return () => {
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('keydown', preventKeyShortcuts);
      document.removeEventListener('dragstart', preventDrag);
      document.removeEventListener('selectstart', (e) => e.preventDefault());
      if (containerRef.current) {
        containerRef.current.removeEventListener('contextmenu', preventContextMenu);
        containerRef.current.removeEventListener('selectstart', (e) => e.preventDefault());
      }
    };
  }, [viewerHtml]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      {/* Modal Container - Más alto */}
      <div className="bg-[#525659] rounded-lg shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 text-white px-4 py-3 flex justify-between items-center rounded-t-lg flex-shrink-0">
          <h3 className="font-semibold text-sm">Visor de Documento</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-gray-800 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 w-full bg-[#525659] relative overflow-hidden" style={{ height: 'calc(95vh - 60px)' }}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-[#11c99d]" />
                <p className="text-gray-600">Cargando documento...</p>
              </div>
            </div>
          )}
          {viewerHtml && (
            <div
              ref={containerRef}
              className="w-full h-full select-none"
              style={{
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
              }}
              onContextMenu={(e) => e.preventDefault()}
              dangerouslySetInnerHTML={{ __html: viewerHtml }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
