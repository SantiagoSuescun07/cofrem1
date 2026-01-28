import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;

    // Obtener el token de los headers de la petición
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "No se proporcionó token de autorización" },
        { status: 401 }
      );
    }

    // Obtener el HTML del endpoint de Drupal
    const viewResponse = await fetch(
      `https://backoffice.cofrem.com.co/document/view/${documentId}`,
      {
        headers: {
          Authorization: authHeader,
          Accept: "text/html",
        },
      }
    );

    if (!viewResponse.ok) {
      return NextResponse.json(
        { error: `Error al obtener el documento: ${viewResponse.statusText}` },
        { status: viewResponse.status }
      );
    }

    let html = await viewResponse.text();

    // Extraer el token del header para pasarlo al proxy de stream
    const token = authHeader.replace("Bearer ", "");

    // Obtener las cookies de sesión de la respuesta (si las hay)
    let sessionCookies = "";
    try {
      const setCookieHeader = viewResponse.headers.get("set-cookie");
      if (setCookieHeader) {
        const cookies = Array.isArray(setCookieHeader)
          ? setCookieHeader
          : [setCookieHeader];
        sessionCookies = cookies.map((cookie) => cookie.split(";")[0]).join("; ");
        console.log("🍪 Cookies de sesión obtenidas:", sessionCookies ? "Sí" : "No");
      }
    } catch (e) {
      console.warn("⚠️ No se pudieron obtener cookies de la respuesta:", e);
    }

    console.log("🔧 Procesando HTML del documento:", documentId);

    // Reemplazar URLs /document/stream por el proxy interno
    html = html.replace(
      /(src|href)=["']([^"']*\/document\/stream\/[^"']+)["']/gi,
      (match, attr, url) => {
        console.log(`📄 Encontrada URL ${attr}="${url}"`);

        let streamUrl = url;

        if (streamUrl.startsWith("http")) {
          try {
            const urlObj = new URL(streamUrl);
            streamUrl = urlObj.pathname + (urlObj.hash || "");
          } catch (e) {
            console.error("Error parsing URL:", e);
            return match;
          }
        }

        const urlParts = streamUrl.split("#");
        const baseUrl = urlParts[0];
        const fragment = urlParts[1] ? `#${urlParts[1]}` : "";

        const streamMatch = baseUrl.match(/\/document\/stream\/(\d+)\/([^/?]+)/);
        if (streamMatch) {
          const [, docId, hash] = streamMatch;

          let proxyUrl = `/api/document/stream/${docId}/${hash}?token=${encodeURIComponent(
            token
          )}`;

          if (sessionCookies) {
            proxyUrl += `&cookies=${encodeURIComponent(sessionCookies)}`;
          }

          proxyUrl += fragment;

          console.log(`✅ Reemplazando ${attr} con proxy URL: ${proxyUrl}`);
          return `${attr}="${proxyUrl}"`;
        }

        console.error("❌ No se pudo extraer ID y hash de la URL:", baseUrl);
        return match;
      }
    );

    html = html.replace(/<meta[^>]*X-Frame-Options[^>]*>/gi, "");

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Frame-Options": "ALLOWALL",
      },
    });
  } catch (error) {
    console.error("Error en proxy de documento:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
