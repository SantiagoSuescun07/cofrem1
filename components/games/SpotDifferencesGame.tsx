// "use client";

// import { useState, useEffect, useRef } from "react";
// import { SpotDifferencesGameDetails } from "@/types/games";
// import { updateRanking } from "@/services/games/update-ranking";
// import { InfoIcon } from "lucide-react";
// import Image from "next/image";

// interface SpotDifferencesGameProps {
//   gameDetails: SpotDifferencesGameDetails;
//   onClose: () => void;
//   campaignNid?: number;
// }

// interface Difference {
//   id: number;
//   x: number; // Porcentaje de posición X (0-100)
//   y: number; // Porcentaje de posición Y (0-100)
//   found: boolean;
// }

// export default function SpotDifferencesGame({
//   gameDetails,
//   onClose,
//   campaignNid,
// }: SpotDifferencesGameProps) {
//   const [differences, setDifferences] = useState<Difference[]>([]);
//   const [foundCount, setFoundCount] = useState<number>(0);
//   const [isGameWon, setIsGameWon] = useState<boolean>(false);
//   const [points, setPoints] = useState<number>(0);
//   const [timeLeft, setTimeLeft] = useState<number>(gameDetails.field_time_limit || 0);
//   const [isGameActive, setIsGameActive] = useState<boolean>(true);
//   const [rankingUpdated, setRankingUpdated] = useState<boolean>(false);
//   const [imageLoaded, setImageLoaded] = useState<boolean>(false);
//   const [originalImageLoaded, setOriginalImageLoaded] = useState<boolean>(false);
//   const [modifiedImageLoaded, setModifiedImageLoaded] = useState<boolean>(false);
//   const [selectedSide, setSelectedSide] = useState<"left" | "right" | null>(null);
//   const intervalRef = useRef<NodeJS.Timeout | null>(null);
//   const leftImageRef = useRef<HTMLDivElement | null>(null);
//   const rightImageRef = useRef<HTMLDivElement | null>(null);

//   const originalImage = gameDetails.field_original_image;
//   const modifiedImage = gameDetails.field_modified_image;
//   const numDifferences = gameDetails.field_num_differences || 5;
//   const pointsPerHit = gameDetails.field_points_per_hit || 20;

//   // Función para detectar diferencias automáticamente comparando las imágenes
//   const detectDifferences = async (
//     originalUrl: string,
//     modifiedUrl: string,
//     numDiff: number
//   ): Promise<Difference[]> => {
//     return new Promise((resolve) => {
//       const img1 = document.createElement("img");
//       const img2 = document.createElement("img");
      
//       img1.crossOrigin = "anonymous";
//       img2.crossOrigin = "anonymous";

//       let loadedCount = 0;
      
//       const onBothLoaded = () => {
//         loadedCount++;
//         if (loadedCount < 2) return;

//         try {
//           // Crear canvas para comparar las imágenes
//           const canvas1 = document.createElement("canvas");
//           const canvas2 = document.createElement("canvas");
//           const ctx1 = canvas1.getContext("2d");
//           const ctx2 = canvas2.getContext("2d");

//           if (!ctx1 || !ctx2) {
//             console.error("No se pudo crear contexto de canvas");
//             resolve([]);
//             return;
//           }

//           // Establecer el tamaño del canvas al tamaño de las imágenes
//           const width = Math.min(img1.width, img2.width, 800); // Limitar tamaño para rendimiento
//           const height = Math.min(img1.height, img2.height, 600);
          
//           canvas1.width = width;
//           canvas1.height = height;
//           canvas2.width = width;
//           canvas2.height = height;

//           // Dibujar las imágenes en los canvas (escaladas)
//           ctx1.drawImage(img1, 0, 0, width, height);
//           ctx2.drawImage(img2, 0, 0, width, height);

//           // Obtener los datos de píxeles
//           const imageData1 = ctx1.getImageData(0, 0, width, height);
//           const imageData2 = ctx2.getImageData(0, 0, width, height);
//           const data1 = imageData1.data;
//           const data2 = imageData2.data;

//           // Crear un mapa de diferencias dividiendo la imagen en áreas
//           const gridSize = 25; // Dividir en cuadrícula de 25x25
//           const cellWidth = width / gridSize;
//           const cellHeight = height / gridSize;
//           const differences: Array<{ x: number; y: number; diff: number }> = [];

//           // Comparar cada celda de la cuadrícula
//           for (let gy = 0; gy < gridSize; gy++) {
//             for (let gx = 0; gx < gridSize; gx++) {
//               let totalDiff = 0;
//               let pixelCount = 0;

//               // Comparar píxeles en esta celda (muestreo cada 2 píxeles para rendimiento)
//               for (let py = Math.floor(gy * cellHeight); py < Math.floor((gy + 1) * cellHeight) && py < height; py += 2) {
//                 for (let px = Math.floor(gx * cellWidth); px < Math.floor((gx + 1) * cellWidth) && px < width; px += 2) {
//                   const index = (py * width + px) * 4;
                  
//                   // Calcular diferencia entre píxeles (RGB)
//                   const rDiff = Math.abs(data1[index] - data2[index]);
//                   const gDiff = Math.abs(data1[index + 1] - data2[index + 1]);
//                   const bDiff = Math.abs(data1[index + 2] - data2[index + 2]);
//                   const diff = (rDiff + gDiff + bDiff) / 3;
                  
//                   totalDiff += diff;
//                   pixelCount++;
//                 }
//               }

//               // Si la diferencia promedio es significativa (> 25), es una diferencia
//               if (pixelCount > 0) {
//                 const avgDiff = totalDiff / pixelCount;
//                 if (avgDiff > 25) {
//                   differences.push({
//                     x: ((gx + 0.5) / gridSize) * 100,
//                     y: ((gy + 0.5) / gridSize) * 100,
//                     diff: avgDiff,
//                   });
//                 }
//               }
//             }
//           }

//           // Ordenar por mayor diferencia y tomar las N más significativas
//           differences.sort((a, b) => b.diff - a.diff);
          
//           // Agrupar diferencias cercanas para evitar duplicados
//           const groupedDifferences: Difference[] = [];
//           const used: boolean[] = new Array(differences.length).fill(false);
//           const minDistance = 7; // Mínimo 7% de distancia entre diferencias

//           for (let i = 0; i < differences.length && groupedDifferences.length < numDiff; i++) {
//             if (used[i]) continue;

//             const current = differences[i];
//             let tooClose = false;

//             // Verificar si está muy cerca de otra diferencia ya seleccionada
//             for (const grouped of groupedDifferences) {
//               const distance = Math.sqrt(
//                 Math.pow(current.x - grouped.x, 2) + Math.pow(current.y - grouped.y, 2)
//               );
//               if (distance < minDistance) {
//                 tooClose = true;
//                 break;
//               }
//             }

//             if (!tooClose) {
//               groupedDifferences.push({
//                 id: groupedDifferences.length,
//                 x: current.x,
//                 y: current.y,
//                 found: false,
//               });
//             }

//             used[i] = true;
//           }

//           console.log(`✅ Detectadas ${groupedDifferences.length} diferencias reales en las imágenes`);
//           console.log("Diferencias:", groupedDifferences.map(d => ({ x: d.x.toFixed(2), y: d.y.toFixed(2) })));
          
//           resolve(groupedDifferences.length > 0 ? groupedDifferences : []);
//         } catch (error) {
//           console.error("Error en detección de diferencias:", error);
//           resolve([]);
//         }
//       };

//       img1.onload = onBothLoaded;
//       img2.onload = onBothLoaded;
      
//       img1.onerror = () => {
//         console.error("Error al cargar imagen original para comparación");
//         resolve([]);
//       };
      
//       img2.onerror = () => {
//         console.error("Error al cargar imagen modificada para comparación");
//         resolve([]);
//       };

//       img1.src = originalUrl;
//       img2.src = modifiedUrl;
//     });
//   };

//   // Actualizar imageLoaded cuando ambas imágenes estén cargadas
//   useEffect(() => {
//     if (originalImageLoaded && modifiedImageLoaded) {
//       setImageLoaded(true);
//     }
//   }, [originalImageLoaded, modifiedImageLoaded]);

//   // Detectar diferencias automáticamente comparando las imágenes
//   useEffect(() => {
//     if (!originalImage || !modifiedImage || differences.length > 0 || !imageLoaded) return;

//     console.log("🔍 Iniciando detección automática de diferencias...");
//     console.log("Imágenes:", { original: originalImage?.url, modified: modifiedImage?.url });

//     // Si hay coordenadas guardadas, usarlas primero (opcional, pero priorizamos detección automática)
//     if (gameDetails.field_differences_coordinates) {
//       try {
//         const coords = JSON.parse(gameDetails.field_differences_coordinates);
//         if (Array.isArray(coords) && coords.length > 0) {
//           console.log("✅ Usando coordenadas guardadas:", coords);
//           setDifferences(
//             coords.map((coord: any, index: number) => ({
//               id: index,
//               x: coord.x || Math.random() * 80 + 10,
//               y: coord.y || Math.random() * 80 + 10,
//               found: false,
//             }))
//           );
//           return;
//         }
//       } catch (e) {
//         console.warn("⚠️ Error parsing coordinates, detectando automáticamente:", e);
//       }
//     }

//     // Detectar diferencias automáticamente comparando las imágenes reales
//     console.log("🔬 Analizando diferencias reales entre las imágenes...");
//     detectDifferences(originalImage.url, modifiedImage.url, numDifferences)
//       .then((detectedDifferences) => {
//         if (detectedDifferences.length > 0) {
//           console.log(`✅ Se detectaron ${detectedDifferences.length} diferencias reales`);
//           setDifferences(detectedDifferences);
//         } else {
//           // Si no se detectaron diferencias, usar aleatorias como fallback
//           console.warn("⚠️ No se detectaron diferencias automáticamente, usando posiciones aleatorias");
//           const fallbackDifferences: Difference[] = [];
//           for (let i = 0; i < numDifferences; i++) {
//             fallbackDifferences.push({
//               id: i,
//               x: Math.random() * 80 + 10,
//               y: Math.random() * 80 + 10,
//               found: false,
//             });
//           }
//           setDifferences(fallbackDifferences);
//         }
//       })
//       .catch((error) => {
//         console.error("❌ Error al detectar diferencias:", error);
//         // Fallback a aleatorias
//         const fallbackDifferences: Difference[] = [];
//         for (let i = 0; i < numDifferences; i++) {
//           fallbackDifferences.push({
//             id: i,
//             x: Math.random() * 80 + 10,
//             y: Math.random() * 80 + 10,
//             found: false,
//           });
//         }
//         setDifferences(fallbackDifferences);
//       });
//   }, [originalImage, modifiedImage, numDifferences, gameDetails.field_differences_coordinates, imageLoaded]);

//   // Timer
//   useEffect(() => {
//     if (!isGameActive || isGameWon || !gameDetails.field_time_limit || gameDetails.field_time_limit === 0) {
//       return;
//     }

//     intervalRef.current = setInterval(() => {
//       setTimeLeft((prev) => {
//         if (prev <= 1) {
//           setIsGameActive(false);
//           return 0;
//         }
//         return prev - 1;
//       });
//     }, 1000);

//     return () => {
//       if (intervalRef.current) {
//         clearInterval(intervalRef.current);
//       }
//     };
//   }, [isGameActive, isGameWon, gameDetails.field_time_limit]);

//   // Verificar si el juego está completo
//   useEffect(() => {
//     if (foundCount === numDifferences && !isGameWon && isGameActive) {
//       setIsGameWon(true);
//       setIsGameActive(false);

//       // Calcular puntos
//       const basePoints = gameDetails.field_points || 100;
//       const foundPoints = foundCount * pointsPerHit;
//       const timeBonus = gameDetails.field_time_limit != null && gameDetails.field_time_limit > 0 
//         ? Math.max(0, Math.floor(timeLeft / 10))
//         : 50;
//       const finalPoints = basePoints + foundPoints + timeBonus;
      
//       setPoints(finalPoints);

//       // Actualizar ranking
//       if (gameDetails.drupal_internal__id && !rankingUpdated) {
//         setRankingUpdated(true);
//         updateRanking(gameDetails.drupal_internal__id, finalPoints).catch((error) => {
//           console.warn("No se pudo actualizar el ranking:", error);
//         });
//       }
//     }
//   }, [foundCount, numDifferences, isGameWon, isGameActive, gameDetails, campaignNid, rankingUpdated, timeLeft, pointsPerHit]);

//   const handleImageClick = (e: React.MouseEvent<HTMLDivElement>, side: "left" | "right") => {
//     if (!isGameActive || isGameWon || !imageLoaded) {
//       console.log("⚠️ Click ignorado:", { isGameActive, isGameWon, imageLoaded });
//       return;
//     }

//     const rect = e.currentTarget.getBoundingClientRect();
//     const x = ((e.clientX - rect.left) / rect.width) * 100;
//     const y = ((e.clientY - rect.top) / rect.height) * 100;

//     console.log(`🖱️ Click en ${side}:`, { x: x.toFixed(2), y: y.toFixed(2) });
//     console.log("Diferencias disponibles:", differences.filter(d => !d.found).map(d => ({ id: d.id, x: d.x.toFixed(2), y: d.y.toFixed(2) })));

//     // Verificar si el click está cerca de alguna diferencia no encontrada
//     const tolerance = 5; // 5% de tolerancia (aumentada para facilitar la detección)
//     const clickedDifference = differences.find(
//       (diff) =>
//         !diff.found &&
//         Math.abs(diff.x - x) < tolerance &&
//         Math.abs(diff.y - y) < tolerance
//     );

//     if (clickedDifference) {
//       console.log("✅ Diferencia encontrada!", clickedDifference);
//       // Marcar la diferencia como encontrada
//       setDifferences((prev) =>
//         prev.map((diff) =>
//           diff.id === clickedDifference.id ? { ...diff, found: true } : diff
//         )
//       );
//       setFoundCount((prev) => prev + 1);
//       setPoints((prev) => prev + pointsPerHit);
//       setSelectedSide(side);
//       setTimeout(() => setSelectedSide(null), 500);
//     } else {
//       console.log("❌ No se encontró diferencia cerca del click");
//       // Feedback visual negativo
//       setSelectedSide(side);
//       setTimeout(() => setSelectedSide(null), 200);
//     }
//   };

//   const handleRetry = () => {
//     setDifferences((prev) => prev.map((diff) => ({ ...diff, found: false })));
//     setFoundCount(0);
//     setIsGameWon(false);
//     setIsGameActive(true);
//     setPoints(0);
//     setTimeLeft(gameDetails.field_time_limit || 0);
//     setRankingUpdated(false);
//     setImageLoaded(false);
//     setOriginalImageLoaded(false);
//     setModifiedImageLoaded(false);
//     if (intervalRef.current) {
//       clearInterval(intervalRef.current);
//     }
//   };

//   const formatTime = (seconds: number): string => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
//   };

//   if (!originalImage || !modifiedImage) {
//     return (
//       <div className="min-h-screen w-full bg-gradient-to-br from-[#e67e22]/10 via-white to-[#e67e22]/5 py-6">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
//           <div className="bg-white rounded-2xl shadow-lg border border-red-200 p-8 text-center">
//             <p className="text-red-500 text-lg">No hay imágenes disponibles para el juego</p>
//             <button
//               onClick={onClose}
//               className="mt-4 px-6 py-3 bg-[#e67e22] text-white rounded-xl font-semibold hover:bg-[#e67e22]/90"
//             >
//               Volver
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen w-full bg-gradient-to-br from-[#e67e22]/10 via-white to-[#e67e22]/5 py-6">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
//         {/* Card unificada con header e instrucciones */}
//         <div className="mb-6">
//           <div className="bg-white rounded-2xl shadow-lg border border-[#e67e22]/20 p-6">
//             {/* Header */}
//             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 pb-4 border-b border-gray-200">
//               <div className="flex items-center gap-4">
//                 <div className="w-14 h-14 bg-gradient-to-br from-[#e67e22] to-[#d35400] rounded-xl flex items-center justify-center text-2xl shadow-md flex-shrink-0">
//                   🔍
//                 </div>
//                 <div>
//                   <h1 className="text-2xl sm:text-3xl  text-gray-900">
//                     {gameDetails.field_title}
//                   </h1>
//                   <p className="text-sm text-gray-500 mt-1">Encuentra las Diferencias</p>
//                 </div>
//               </div>
//               <div className="flex gap-3 sm:gap-4">
//                 {gameDetails.field_time_limit && gameDetails.field_time_limit > 0 ? (
//                   <div className="flex items-center gap-2 bg-white rounded-xl border-2 px-4 py-2.5 shadow-sm">
//                     <span className="text-lg">⏱️</span>
//                     <div className="flex flex-col">
//                       <span className="text-xs text-gray-500 leading-none">Tiempo</span>
//                       <span className={`text-lg  leading-none ${
//                         timeLeft < 30 ? "text-red-500" : "text-gray-700"
//                       }`}>
//                         {formatTime(timeLeft)}
//                       </span>
//                     </div>
//                   </div>
//                 ) : null}
//                 <div className="flex items-center gap-2 bg-white rounded-xl border-2 px-4 py-2.5 shadow-sm">
//                   <span className="text-lg">🔍</span>
//                   <div className="flex flex-col">
//                     <span className="text-xs text-gray-500 leading-none">Encontradas</span>
//                     <span className="text-lg  text-gray-700 leading-none">
//                       {foundCount}/{numDifferences}
//                     </span>
//                   </div>
//                 </div>
//                 {isGameWon && (
//                   <div className="flex items-center gap-2 bg-gradient-to-br from-[#fff4e6] to-white rounded-xl border-2 border-[#e67e22] px-4 py-2.5 shadow-sm">
//                     <span className="text-lg">🌟</span>
//                     <div className="flex flex-col">
//                       <span className="text-xs text-gray-500 leading-none">Puntos</span>
//                       <span className="text-lg  text-[#e67e22] leading-none">
//                         {points}
//                       </span>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
            
//             {/* Instrucciones */}
//             {gameDetails.field_description && gameDetails.field_description.trim() !== "" && (
//               <div className="flex items-start gap-3">
//                 <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#e67e22] to-[#d35400] rounded-lg flex items-center justify-center text-white shadow-md">
//                   <InfoIcon className="w-5 h-5" />
//                 </div>
//                 <div className="flex-1">
//                   <h3 className="text-base  text-[#e67e22] mb-1.5">
//                     Instrucciones
//                   </h3>
//                   <p className="text-gray-700 leading-relaxed text-sm">
//                     {gameDetails.field_description}
//                   </p>
//                   <p className="text-gray-600 text-sm mt-2">
//                     Haz clic en las diferencias que encuentres entre las dos imágenes. 
//                     Debes encontrar {numDifferences} diferencias.
//                   </p>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Contenido principal del juego */}
//         <div className="flex-1 flex items-center justify-center min-h-[500px]">
//           <div className="bg-white rounded-2xl border-2 border-[#e67e22]/30 shadow-xl p-6 sm:p-8 max-w-7xl w-full">
//             {/* Resultado del juego */}
//             {isGameWon && (
//               <div className="text-center mb-6">
//                 <div className="bg-green-50 border-2 border-green-400 rounded-xl p-6 mb-4">
//                   <div className="text-5xl mb-2">🎉</div>
//                   <h3 className="text-2xl  text-green-700 mb-2">
//                     ¡Felicidades!
//                   </h3>
//                   <p className="text-green-600 mb-2">
//                     Has encontrado todas las {numDifferences} diferencias
//                   </p>
//                   <p className="text-green-600">
//                     Has ganado {points} puntos
//                   </p>
//                   {gameDetails.field_badges?.name && (
//                     <p className="text-[#09d6a6] font-bold text-xl mt-4">
//                       🏆 Insignia obtenida: <span className="text-purple-600">{gameDetails.field_badges.name}</span>
//                     </p>
//                   )}
//                 </div>
//                 <div className="flex gap-4 justify-center">
//                   <button
//                     onClick={handleRetry}
//                     className="px-6 py-3 bg-gradient-to-r from-[#e67e22] to-[#d35400] text-white rounded-xl text-lg font-semibold shadow-lg hover:from-[#d35400] hover:to-[#e67e22] transition-all duration-200 transform hover:scale-105"
//                   >
//                     🔄 Reintentar
//                   </button>
//                   <button
//                     onClick={onClose}
//                     className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl text-lg font-semibold shadow-lg hover:bg-gray-300 transition-all duration-200"
//                   >
//                     Volver
//                   </button>
//                 </div>
//               </div>
//             )}

//             {!isGameActive && !isGameWon && gameDetails.field_time_limit && gameDetails.field_time_limit > 0 && (
//               <div className="text-center mb-6">
//                 <div className="bg-red-50 border-2 border-red-400 rounded-xl p-6 mb-4">
//                   <div className="text-5xl mb-2">⏱️</div>
//                   <h3 className="text-2xl  text-red-700 mb-2">
//                     ¡Tiempo agotado!
//                   </h3>
//                   <p className="text-red-600 mb-4">
//                     Has encontrado {foundCount} de {numDifferences} diferencias
//                   </p>
//                   <button
//                     onClick={handleRetry}
//                     className="px-6 py-3 bg-gradient-to-r from-[#e67e22] to-[#d35400] text-white rounded-xl text-lg font-semibold shadow-lg hover:from-[#d35400] hover:to-[#e67e22] transition-all duration-200 transform hover:scale-105"
//                   >
//                     🔄 Reintentar
//                   </button>
//                 </div>
//               </div>
//             )}

//             {/* Mensaje mientras cargan las imágenes */}
//             {!imageLoaded && (
//               <div className="text-center mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
//                 <p className="text-blue-700 font-medium">
//                   Cargando imágenes... Por favor espera
//                 </p>
//               </div>
//             )}

//             {/* Mensaje cuando las imágenes están listas */}
//             {imageLoaded && !isGameWon && isGameActive && (
//               <div className="text-center mb-4">
//                 <p className="text-gray-600 text-sm">
//                   Haz clic en las diferencias que encuentres entre las dos imágenes
//                 </p>
//               </div>
//             )}

//             {/* Imágenes lado a lado */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               {/* Imagen original */}
//               <div className="relative">
//                 <h3 className="text-center font-semibold text-gray-700 mb-2">Imagen Original</h3>
//                 <div
//                   ref={leftImageRef}
//                   onClick={(e) => handleImageClick(e, "left")}
//                   onDragStart={(e) => e.preventDefault()}
//                   className={`relative w-full border-2 rounded-lg overflow-hidden select-none ${
//                     !imageLoaded 
//                       ? "cursor-wait opacity-50" 
//                       : selectedSide === "left" 
//                         ? "cursor-crosshair border-[#e67e22] ring-4 ring-[#e67e22]/30" 
//                         : "cursor-crosshair border-gray-300"
//                   }`}
//                   style={{ aspectRatio: "16/9", userSelect: "none", WebkitUserSelect: "none" }}
//                 >
//                   {!originalImageLoaded && (
//                     <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
//                       <div className="text-center">
//                         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e67e22] mx-auto mb-2"></div>
//                         <p className="text-sm text-gray-600">Cargando imagen...</p>
//                       </div>
//                     </div>
//                   )}
//                   <Image
//                     src={originalImage.url}
//                     alt="Imagen original"
//                     fill
//                     className="object-contain select-none"
//                     draggable={false}
//                     onDragStart={(e) => e.preventDefault()}
//                     onLoad={() => {
//                       console.log("✅ Imagen original cargada:", originalImage.url);
//                       setOriginalImageLoaded(true);
//                     }}
//                     onError={(e) => {
//                       console.error("❌ Error al cargar imagen original:", originalImage.url);
//                       console.error("Error:", e);
//                     }}
//                     priority
//                   />
//                   {/* Marcadores de diferencias encontradas - Imagen Original */}
//                   {differences.map((diff) => {
//                     if (!diff.found) return null;
//                     return (
//                       <div
//                         key={diff.id}
//                         className="absolute pointer-events-none animate-pulse z-10"
//                         style={{
//                           left: `${diff.x}%`,
//                           top: `${diff.y}%`,
//                           transform: "translate(-50%, -50%)",
//                         }}
//                       >
//                         <div className="w-8 h-8 bg-green-500 rounded-full border-4 border-white shadow-xl flex items-center justify-center">
//                           <span className="text-white text-sm font-bold">✓</span>
//                         </div>
//                         <div className="absolute inset-0 w-12 h-12 bg-green-500 rounded-full opacity-30 animate-ping" style={{ transform: "translate(-25%, -25%)" }}></div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>

//               {/* Imagen modificada */}
//               <div className="relative">
//                 <h3 className="text-center font-semibold text-gray-700 mb-2">Imagen Modificada</h3>
//                 <div
//                   ref={rightImageRef}
//                   onClick={(e) => handleImageClick(e, "right")}
//                   onDragStart={(e) => e.preventDefault()}
//                   className={`relative w-full border-2 rounded-lg overflow-hidden select-none ${
//                     !imageLoaded 
//                       ? "cursor-wait opacity-50" 
//                       : selectedSide === "right" 
//                         ? "cursor-crosshair border-[#e67e22] ring-4 ring-[#e67e22]/30" 
//                         : "cursor-crosshair border-gray-300"
//                   }`}
//                   style={{ aspectRatio: "16/9", userSelect: "none", WebkitUserSelect: "none" }}
//                 >
//                   {!modifiedImageLoaded && (
//                     <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
//                       <div className="text-center">
//                         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e67e22] mx-auto mb-2"></div>
//                         <p className="text-sm text-gray-600">Cargando imagen...</p>
//                       </div>
//                     </div>
//                   )}
//                   <Image
//                     src={modifiedImage.url}
//                     alt="Imagen modificada"
//                     fill
//                     className="object-contain select-none"
//                     draggable={false}
//                     onDragStart={(e) => e.preventDefault()}
//                     onLoad={() => {
//                       console.log("✅ Imagen modificada cargada:", modifiedImage.url);
//                       setModifiedImageLoaded(true);
//                     }}
//                     onError={(e) => {
//                       console.error("❌ Error al cargar imagen modificada:", modifiedImage.url);
//                       console.error("Error:", e);
//                     }}
//                     priority
//                   />
//                   {/* Marcadores de diferencias encontradas - Imagen Modificada */}
//                   {differences.map((diff) => {
//                     if (!diff.found) return null;
//                     return (
//                       <div
//                         key={diff.id}
//                         className="absolute pointer-events-none animate-pulse z-10"
//                         style={{
//                           left: `${diff.x}%`,
//                           top: `${diff.y}%`,
//                           transform: "translate(-50%, -50%)",
//                         }}
//                       >
//                         <div className="w-8 h-8 bg-green-500 rounded-full border-4 border-white shadow-xl flex items-center justify-center">
//                           <span className="text-white text-sm font-bold">✓</span>
//                         </div>
//                         <div className="absolute inset-0 w-12 h-12 bg-green-500 rounded-full opacity-30 animate-ping" style={{ transform: "translate(-25%, -25%)" }}></div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

