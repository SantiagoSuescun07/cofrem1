/**
 * Normaliza URLs de imágenes para evitar problemas de doble encoding
 * y asegurar que las URLs estén correctamente formateadas para Next.js Image
 */
export function normalizeImageUrl(baseUrl: string, path: string): string {
  if (!path) return "";
  
  // Si la URL ya es absoluta, normalizarla y retornarla
  if (path.startsWith("http://") || path.startsWith("https://")) {
    try {
      const url = new URL(path);
      return url.toString();
    } catch {
      return path;
    }
  }
  
  let normalizedPath = path;
  
  // Manejar doble encoding: detectar patrones como %2520 (que debería ser %20)
  // pero preservar caracteres que deben estar codificados como %23 (#)
  try {
    // Detectar doble encoding (patrón %25 seguido de dos dígitos hex)
    // Pero preservar %23 que debe permanecer codificado
    if (normalizedPath.includes("%25") && /%25[0-9A-Fa-f]{2}/.test(normalizedPath)) {
      // Hay doble encoding, pero necesitamos preservar %23
      // Primero, reemplazar temporalmente %2523 con un marcador
      const placeholder = "___PERCENT_23_PLACEHOLDER___";
      normalizedPath = normalizedPath.replace(/%2523/g, placeholder);
      
      // Decodificar el resto del doble encoding
      normalizedPath = decodeURIComponent(normalizedPath);
      
      // Restaurar %23 (que ahora puede estar como # o como placeholder)
      normalizedPath = normalizedPath.replace(placeholder, "%23");
      normalizedPath = normalizedPath.replace(/#/g, "%23");
    } else {
      // No hay doble encoding, pero asegurarnos de que # esté codificado
      normalizedPath = normalizedPath.replace(/#/g, "%23");
    }
    
    // También codificar espacios si aparecen sin codificar
    normalizedPath = normalizedPath.replace(/ /g, "%20");
  } catch (e) {
    // Si falla, usar la original pero asegurar que # esté codificado
    normalizedPath = path.replace(/#/g, "%23").replace(/ /g, "%20");
  }
  
  // Normalizar la URL base (remover barra final)
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  
  // Asegurar que el path empiece con / y eliminar barras duplicadas
  if (!normalizedPath.startsWith("/")) {
    normalizedPath = `/${normalizedPath}`;
  }
  // Eliminar barras duplicadas en el path
  normalizedPath = normalizedPath.replace(/\/+/g, "/");
  
  // Construir la URL final usando URL constructor para manejar encoding correctamente
  try {
    const finalUrl = new URL(normalizedPath, normalizedBase);
    return finalUrl.toString();
  } catch {
    // Si falla, construir manualmente
    const finalUrl = `${normalizedBase}${normalizedPath}`;
    return finalUrl;
  }
}
