import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get("url");
    const token = searchParams.get("token");

    if (!fileUrl) {
      return NextResponse.json(
        { error: "No se proporcionó la URL del archivo" },
        { status: 400 }
      );
    }

    // Obtener el token de los query params o headers
    const authHeader = request.headers.get("authorization");
    const accessToken = token || authHeader?.replace("Bearer ", "") || null;

    if (!accessToken) {
      return NextResponse.json(
        { error: "No se proporcionó token de autorización" },
        { status: 401 }
      );
    }

    // Decodificar la URL del archivo
    let decodedUrl = decodeURIComponent(fileUrl);
    
    console.log("🔍 Procesando URL:", {
      original: fileUrl,
      decoded: decodedUrl,
      hasToken: !!accessToken,
      tokenPreview: accessToken ? `${accessToken.substring(0, 20)}...` : "none"
    });

    // Si la URL es un endpoint de stream de Drupal (/document/stream/{id}/{hash})
    // Construir la URL completa y obtener el stream directamente
    if (decodedUrl.includes("/document/stream/")) {
      // Si es una URL relativa, construir la URL completa
      if (!decodedUrl.startsWith("http")) {
        decodedUrl = `https://backoffice.cofrem.com.co${decodedUrl.startsWith("/") ? "" : "/"}${decodedUrl}`;
      }
      // Remover el hash/fragmento si existe (no se envía al servidor)
      const urlWithoutHash = decodedUrl.split("#")[0];
      decodedUrl = urlWithoutHash;
    }

    // Si la URL es un endpoint JSON:API de archivo, necesitamos obtener la URL de descarga
    if (decodedUrl.includes("/jsonapi/file/file/")) {
      try {
        // Hacer una petición al endpoint JSON:API para obtener los detalles del archivo
        const fileInfoResponse = await fetch(decodedUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.api+json",
          },
        });

        if (!fileInfoResponse.ok) {
          return NextResponse.json(
            { error: `Error al obtener información del archivo: ${fileInfoResponse.statusText}` },
            { status: fileInfoResponse.status }
          );
        }

        const fileInfo = await fileInfoResponse.json();
        // Obtener la URL de descarga del archivo desde la respuesta JSON:API
        const uri = fileInfo?.data?.attributes?.uri?.url;
        const fileId = fileInfo?.data?.attributes?.drupal_internal__fid;
        
        console.log("📄 Información del archivo JSON:API:", {
          uri,
          fileId,
          uriType: uri ? (uri.startsWith("private://") ? "private" : uri.startsWith("public://") ? "public" : "other") : "none"
        });
        
        if (uri) {
          // Si el URI es private:// o es una URL /document/view/, SIEMPRE usar el endpoint /document/view/{id} para obtener el stream URL
          // NUNCA intentar acceder directamente a archivos privados
          if (uri.startsWith("private://") || uri.includes("/document/view/")) {
            // Para archivos privados, usar el endpoint /document/view/{id} para obtener el stream URL
            let viewId = fileId;
            
            // Si el URI ya contiene /document/view/{id}, extraer el ID de ahí
            if (uri.includes("/document/view/")) {
              const viewMatch = uri.match(/\/document\/view\/(\d+)/);
              if (viewMatch && viewMatch[1]) {
                viewId = parseInt(viewMatch[1]);
              }
            }
            
            if (viewId) {
              const viewUrl = `https://backoffice.cofrem.com.co/document/view/${viewId}`;
              
              console.log("🔍 Intentando obtener stream URL desde:", viewUrl);
              
              // Obtener el HTML del endpoint de visualización para extraer el stream URL y las cookies
              const viewResponse = await fetch(viewUrl, {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  Accept: "text/html",
                  "User-Agent": "Mozilla/5.0",
                },
                redirect: "follow",
              });

              console.log("📥 Respuesta de /document/view:", {
                status: viewResponse.status,
                statusText: viewResponse.statusText,
                ok: viewResponse.ok,
                headers: {
                  setCookie: viewResponse.headers.get("set-cookie"),
                  contentType: viewResponse.headers.get("content-type"),
                }
              });

              if (viewResponse.ok) {
                const html = await viewResponse.text();
                // Extraer la URL del stream del iframe en el HTML
                const streamMatch = html.match(/src=["']([^"']*\/document\/stream\/(\d+)\/([a-f0-9]+)[^"']*)["']/i);
                
                if (streamMatch && streamMatch[1] && streamMatch[2] && streamMatch[3]) {
                  const streamId = streamMatch[2];
                  const streamHash = streamMatch[3];
                  
                  console.log("✅ Stream URL encontrado:", { streamId, streamHash });
                  
                  // Obtener cookies de la respuesta
                  const setCookieHeader = viewResponse.headers.get("set-cookie");
                  let sessionCookies = "";
                  if (setCookieHeader) {
                    const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
                    sessionCookies = cookies.map((cookie) => cookie.split(";")[0]).join("; ");
                    console.log("🍪 Cookies obtenidas:", sessionCookies ? "Sí" : "No");
                  }
                  
                  // Obtener el stream directamente usando el endpoint de Drupal con las cookies
                  const streamUrl = `https://backoffice.cofrem.com.co/document/stream/${streamId}/${streamHash}`;
                  
                  console.log("🌊 Obteniendo stream desde:", streamUrl);
                  
                  const streamResponse = await fetch(streamUrl, {
                    headers: {
                      Authorization: `Bearer ${accessToken}`,
                      Cookie: sessionCookies || "",
                      Accept: "*/*",
                    },
                  });
                  
                  console.log("📥 Respuesta del stream:", {
                    status: streamResponse.status,
                    statusText: streamResponse.statusText,
                    ok: streamResponse.ok
                  });
                  
                  if (!streamResponse.ok) {
                    return NextResponse.json(
                      { error: `Error al obtener el stream: ${streamResponse.statusText}` },
                      { status: streamResponse.status }
                    );
                  }
                  
                  const streamBuffer = await streamResponse.arrayBuffer();
                  const streamContentType = streamResponse.headers.get("content-type") || "application/pdf";
                  
                  console.log("✅ Stream obtenido exitosamente");
                  
                  // Retornar el PDF directamente
                  return new NextResponse(streamBuffer, {
                    status: 200,
                    headers: {
                      "Content-Type": streamContentType,
                      "Content-Disposition": "inline",
                      "X-Frame-Options": "ALLOWALL",
                      "Cache-Control": "private, max-age=3600",
                    },
                  });
                } else {
                  console.warn("⚠️ No se encontró el stream URL en el HTML");
                  return NextResponse.json(
                    { error: "No se pudo extraer la URL del stream del documento privado desde el HTML" },
                    { status: 400 }
                  );
                }
              } else {
                console.error("❌ Error al obtener /document/view:", viewResponse.status, viewResponse.statusText);
                return NextResponse.json(
                  { error: `Error al obtener el endpoint de visualización: ${viewResponse.statusText}. El archivo puede requerir autenticación adicional o el token puede haber expirado.` },
                  { status: viewResponse.status }
                );
              }
              
              // Si llegamos aquí, no se pudo obtener el stream URL del HTML
              return NextResponse.json(
                { error: "No se pudo extraer la URL del stream del documento privado" },
                { status: 400 }
              );
            } else {
              return NextResponse.json(
                { error: "No se pudo obtener el ID del archivo para archivo privado" },
                { status: 400 }
              );
            }
          } else if (uri.startsWith("public://")) {
            // Para archivos públicos, convertir a URL directa
            const filePath = uri.replace(/^public:\/\//, "");
            decodedUrl = `https://backoffice.cofrem.com.co/sites/default/files/${filePath}`;
            console.log("📁 Archivo público, usando URL directa:", decodedUrl);
          } else if (uri.startsWith("http")) {
            decodedUrl = uri;
            console.log("🌐 URL completa encontrada:", decodedUrl);
          } else {
            // URL relativa
            decodedUrl = `https://backoffice.cofrem.com.co${uri.startsWith("/") ? "" : "/"}${uri}`;
            console.log("🔗 URL relativa convertida:", decodedUrl);
          }
        } else {
          return NextResponse.json(
            { error: "No se pudo obtener la URL del archivo desde la respuesta JSON:API" },
            { status: 400 }
          );
        }
      } catch (error: any) {
        console.error("Error al obtener información del archivo JSON:API:", error);
        return NextResponse.json(
          { error: `Error al procesar la URL del archivo: ${error.message}` },
          { status: 500 }
        );
      }
    }

    // Hacer la petición al archivo PDF con autenticación
    console.log("📥 Obteniendo PDF desde:", decodedUrl);
    
    const pdfResponse = await fetch(decodedUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/pdf, */*",
      },
    });

    console.log("📥 Respuesta del PDF:", {
      status: pdfResponse.status,
      statusText: pdfResponse.statusText,
      ok: pdfResponse.ok,
      contentType: pdfResponse.headers.get("content-type")
    });

    if (!pdfResponse.ok) {
      // Si es Forbidden y la URL contiene /sites/default/files/, podría ser un archivo privado
      // Intentar usar el endpoint /document/view/ si tenemos el fileId
      if (pdfResponse.status === 403 && decodedUrl.includes("/sites/default/files/")) {
        console.warn("⚠️ Archivo devolvió Forbidden, podría ser privado. Intentando obtener stream URL...");
        
        // Intentar extraer el fileId de la URL JSON:API original si está disponible
        const originalUrl = decodeURIComponent(fileUrl);
        if (originalUrl.includes("/jsonapi/file/file/")) {
          try {
            const fileInfoResponse = await fetch(originalUrl, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.api+json",
              },
            });
            
            if (fileInfoResponse.ok) {
              const fileInfo = await fileInfoResponse.json();
              const fileId = fileInfo?.data?.attributes?.drupal_internal__fid;
              
              if (fileId) {
                const viewUrl = `https://backoffice.cofrem.com.co/document/view/${fileId}`;
                const viewResponse = await fetch(viewUrl, {
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: "text/html",
                  },
                });
                
                if (viewResponse.ok) {
                  const html = await viewResponse.text();
                  const streamMatch = html.match(/src=["']([^"']*\/document\/stream\/(\d+)\/([a-f0-9]+)[^"']*)["']/i);
                  
                  if (streamMatch && streamMatch[2] && streamMatch[3]) {
                    const streamId = streamMatch[2];
                    const streamHash = streamMatch[3];
                    const setCookieHeader = viewResponse.headers.get("set-cookie");
                    let sessionCookies = "";
                    if (setCookieHeader) {
                      const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
                      sessionCookies = cookies.map((cookie) => cookie.split(";")[0]).join("; ");
                    }
                    
                    const streamUrl = `https://backoffice.cofrem.com.co/document/stream/${streamId}/${streamHash}`;
                    const streamResponse = await fetch(streamUrl, {
                      headers: {
                        Authorization: `Bearer ${accessToken}`,
                        Cookie: sessionCookies || "",
                        Accept: "*/*",
                      },
                    });
                    
                    if (streamResponse.ok) {
                      const streamBuffer = await streamResponse.arrayBuffer();
                      const streamContentType = streamResponse.headers.get("content-type") || "application/pdf";
                      
                      return new NextResponse(streamBuffer, {
                        status: 200,
                        headers: {
                          "Content-Type": streamContentType,
                          "Content-Disposition": "inline",
                          "X-Frame-Options": "ALLOWALL",
                          "Cache-Control": "private, max-age=3600",
                        },
                      });
                    }
                  }
                }
              }
            }
          } catch (fallbackError) {
            console.error("Error en fallback:", fallbackError);
          }
        }
      }
      
      return NextResponse.json(
        { error: `Error al obtener el PDF: ${pdfResponse.statusText}` },
        { status: pdfResponse.status }
      );
    }

    // Obtener el contenido
    const buffer = await pdfResponse.arrayBuffer();
    const contentType = pdfResponse.headers.get("content-type") || "";

    // Verificar que realmente es un PDF
    if (!contentType.includes("pdf") && !contentType.includes("application/pdf")) {
      // Si no es PDF, podría ser HTML (endpoint de visualización) o una imagen (archivo privado)
      // Intentar leer los primeros bytes para verificar
      const uint8Array = new Uint8Array(buffer);
      const pdfHeader = String.fromCharCode(...uint8Array.slice(0, 4));
      
      // Los PDFs comienzan con "%PDF"
      if (pdfHeader !== "%PDF") {
        return NextResponse.json(
          { error: "El archivo no es un PDF válido. Puede ser un documento privado o un endpoint incorrecto." },
          { status: 400 }
        );
      }
    }

    // Retornar el PDF con headers que permitan visualización en iframe
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType || "application/pdf",
        "Content-Disposition": "inline", // Mostrar en lugar de descargar
        "X-Frame-Options": "ALLOWALL", // Permitir en iframe
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error en proxy de PDF:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
