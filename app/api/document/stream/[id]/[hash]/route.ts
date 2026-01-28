import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; hash: string }> }
) {

  try {
    const { id, hash } = await params;
    
    console.log("🌊 Proxy de stream - ID:", id, "Hash:", hash);
    
    // Obtener el token de los query params (pasado desde el proxy de view)
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const cookiesFromQuery = searchParams.get("cookies");
    
    // También intentar obtener de headers si está disponible
    const authHeader = request.headers.get("authorization");
    
    // Usar el token del query param o del header
    const accessToken = token || authHeader?.replace("Bearer ", "") || null;
    
    console.log("🔑 Token recibido:", {
      hasTokenParam: !!token,
      hasAuthHeader: !!authHeader,
      tokenPreview: accessToken ? `${accessToken.substring(0, 20)}...` : "none",
      hasCookies: !!cookiesFromQuery
    });
    
    if (!accessToken) {
      console.error("❌ No se proporcionó token de autorización");
      return NextResponse.json(
        { error: "No se proporcionó token de autorización" },
        { status: 401 }
      );
    }
    
    // Usar las cookies del query param o las del header de la petición
    const cookieHeader = cookiesFromQuery || request.headers.get("cookie") || "";

    // Construir la URL del stream (el fragmento no se envía al servidor, así que no lo incluimos aquí)
    const streamUrl = `https://backoffice.cofrem.com.co/document/stream/${id}/${hash}`;
    
    console.log("📡 Obteniendo stream desde:", streamUrl);
    console.log("📋 Headers que se envían:", {
      hasAuthorization: true,
      hasCookie: !!cookieHeader,
      cookiePreview: cookieHeader ? cookieHeader.substring(0, 50) + "..." : "none"
    });

    // Hacer la petición al endpoint de Drupal
    const streamResponse = await fetch(streamUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Cookie: cookieHeader || "",
        Accept: "*/*",
      },
    });
    
    console.log("📥 Respuesta del servidor:", {
      status: streamResponse.status,
      statusText: streamResponse.statusText,
      contentType: streamResponse.headers.get("content-type"),
    });

    if (!streamResponse.ok) {
      console.error("❌ Error al obtener stream:", streamResponse.status, streamResponse.statusText);
      return NextResponse.json(
        { error: `Error al obtener el stream: ${streamResponse.statusText}` },
        { status: streamResponse.status }
      );
    }

    // Obtener el tipo de contenido del response original
    const contentType = streamResponse.headers.get("content-type") || "application/pdf";
    
    console.log("✅ Stream obtenido exitosamente, Content-Type:", contentType);
    
    // Obtener el contenido
    const buffer = await streamResponse.arrayBuffer();

    // Retornar el contenido con los headers apropiados
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": streamResponse.headers.get("content-disposition") || "inline",
        "Cache-Control": "public, max-age=3600",
        "X-Frame-Options": "ALLOWALL",
      },
    });
  } catch (error) {
    console.error("Error en proxy de stream:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
