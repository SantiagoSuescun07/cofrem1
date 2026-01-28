import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const viewUrl = searchParams.get("url");
    const token = searchParams.get("token");

    if (!viewUrl || !token) {
      return NextResponse.json(
        { error: "Se requiere la URL de visualización y el token" },
        { status: 400 }
      );
    }

    // Hacer petición al endpoint de visualización de Drupal desde el servidor
    const viewResponse = await fetch(viewUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/html",
      },
    });

    if (!viewResponse.ok) {
      // Si el archivo es privado (Forbidden), intentar obtener el stream URL directamente desde el JSON:API
      if (viewResponse.status === 403 || viewResponse.status === 401) {
        // Extraer el ID del documento de la URL
        const docIdMatch = viewUrl.match(/\/document\/view\/(\d+)/);
        if (docIdMatch && docIdMatch[1]) {
          const docId = docIdMatch[1];
          // Intentar obtener el hash del stream desde el JSON:API
          // Por ahora, devolver un error que indique que es privado pero permitir que el cliente intente usar JSON:API
          return NextResponse.json(
            { 
              error: "Forbidden", 
              isPrivate: true,
              message: "El archivo es privado. Intente usar JSON:API directamente."
            },
            { status: 403 }
          );
        }
      }
      return NextResponse.json(
        { error: `Error al obtener el HTML: ${viewResponse.statusText}` },
        { status: viewResponse.status }
      );
    }

    const html = await viewResponse.text();

    // Extraer la URL del stream del iframe en el HTML
    const streamMatch = html.match(/src=["']([^"']*\/document\/stream\/(\d+)\/([a-f0-9]+)[^"']*)["']/i);

    if (!streamMatch || !streamMatch[1] || !streamMatch[2] || !streamMatch[3]) {
      return NextResponse.json(
        { error: "No se encontró la URL del stream en el HTML" },
        { status: 404 }
      );
    }

    const streamId = streamMatch[2];
    const streamHash = streamMatch[3];

    // Obtener cookies de la respuesta si están disponibles
    const setCookieHeader = viewResponse.headers.get("set-cookie");
    let sessionCookies = "";
    if (setCookieHeader) {
      const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
      sessionCookies = cookies.map((cookie) => cookie.split(";")[0]).join("; ");
    }

    // Construir la URL del proxy con el token y las cookies
    const proxyUrl = `/api/document/stream/${streamId}/${streamHash}?token=${encodeURIComponent(token)}`;
    const finalUrl = sessionCookies 
      ? `${proxyUrl}&cookies=${encodeURIComponent(sessionCookies)}`
      : proxyUrl;

    return NextResponse.json({
      streamUrl: finalUrl,
      hasCookies: !!sessionCookies,
    });
  } catch (error) {
    console.error("Error al obtener URL del stream:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
