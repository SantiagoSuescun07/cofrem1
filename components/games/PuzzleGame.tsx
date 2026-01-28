"use client";

import { useState, useEffect, useRef } from "react";
import { PuzzleGameDetails } from "@/types/games";
import { updateRanking } from "@/services/games/update-ranking";
import { InfoIcon } from "lucide-react";
import Image from "next/image";

interface PuzzleGameProps {
  gameDetails: PuzzleGameDetails;
  onClose: () => void;
  campaignNid?: number;
}

interface PuzzlePiece {
  id: number;
  correctPosition: number;
  currentPosition: number;
  imageUrl: string;
  x: number;
  y: number;
}

export default function PuzzleGame({
  gameDetails,
  onClose,
  campaignNid,
}: PuzzleGameProps) {
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [isGameWon, setIsGameWon] = useState<boolean>(false);
  const [points, setPoints] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(gameDetails.field_time_limit || 0);
  const [isGameActive, setIsGameActive] = useState<boolean>(true);
  const [rankingUpdated, setRankingUpdated] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [draggedPiece, setDraggedPiece] = useState<number | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Parsear la dificultad (ejemplo: "6x6 - 36 piezas" -> { rows: 6, cols: 6 })
  const parseDifficulty = (difficulty: string): { rows: number; cols: number } => {
    const match = difficulty.match(/(\d+)x(\d+)/);
    if (match) {
      return { rows: parseInt(match[1], 10), cols: parseInt(match[2], 10) };
    }
    // Default a 3x3 si no se puede parsear
    return { rows: 3, cols: 3 };
  };

  const { rows, cols } = parseDifficulty(gameDetails.field_puzzle_difficulty || "3x3");
  const totalPieces = rows * cols;
  const puzzleImage = gameDetails.field_puzzle_image?.[0];

  // Inicializar el juego cuando la imagen se carga
  useEffect(() => {
    if (!puzzleImage || !imageLoaded) return;

    const initializePuzzle = () => {
      const newPieces: PuzzlePiece[] = [];
      const pieceWidth = 100 / cols;
      const pieceHeight = 100 / rows;

      for (let i = 0; i < totalPieces; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const x = col * pieceWidth;
        const y = row * pieceHeight;

        newPieces.push({
          id: i,
          correctPosition: i,
          currentPosition: i,
          imageUrl: puzzleImage.url,
          x,
          y,
        });
      }

      // Mezclar las piezas haciendo movimientos válidos aleatorios
      // Esto asegura que el rompecabezas sea siempre solucionable
      const shuffled = [...newPieces];
      const emptyIndex = totalPieces - 1;
      
      // Hacer muchos movimientos aleatorios válidos (100-200 movimientos)
      const numMoves = 100 + Math.floor(Math.random() * 100);
      let currentEmptyPos = emptyIndex;
      
      for (let move = 0; move < numMoves; move++) {
        const emptyRow = Math.floor(currentEmptyPos / cols);
        const emptyCol = currentEmptyPos % cols;
        const possibleMoves: number[] = [];
        
        // Encontrar piezas adyacentes al espacio vacío
        for (let i = 0; i < shuffled.length; i++) {
          if (i === emptyIndex) continue;
          const pieceRow = Math.floor(shuffled[i].currentPosition / cols);
          const pieceCol = shuffled[i].currentPosition % cols;
          
          const isAdjacent =
            (Math.abs(pieceRow - emptyRow) === 1 && pieceCol === emptyCol) ||
            (Math.abs(pieceCol - emptyCol) === 1 && pieceRow === emptyRow);
          
          if (isAdjacent) {
            possibleMoves.push(i);
          }
        }
        
        // Mover una pieza aleatoria adyacente
        if (possibleMoves.length > 0) {
          const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
          const pieceToMove = shuffled[randomMove];
          const tempPos = pieceToMove.currentPosition;
          pieceToMove.currentPosition = currentEmptyPos;
          currentEmptyPos = tempPos;
        }
      }
      
      // Actualizar la posición del espacio vacío
      shuffled[emptyIndex].currentPosition = currentEmptyPos;

      setPieces(shuffled);
    };

    initializePuzzle();
  }, [puzzleImage, imageLoaded, rows, cols, totalPieces]);

  // Timer
  useEffect(() => {
    if (!isGameActive || isGameWon || !gameDetails.field_time_limit || gameDetails.field_time_limit === 0) {
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsGameActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isGameActive, isGameWon, gameDetails.field_time_limit]);

  // Verificar si el juego está completo
  useEffect(() => {
    if (pieces.length === 0) return;

    const isComplete = pieces.every(
      (piece) => piece.currentPosition === piece.correctPosition
    );

    if (isComplete && !isGameWon && isGameActive) {
      setIsGameWon(true);
      setIsGameActive(false);

      // Calcular puntos basados en movimientos y tiempo
      const basePoints = gameDetails.field_points || 100;
      const moveBonus = Math.max(0, 100 - moves * 2);
      const timeBonus = gameDetails.field_time_limit != null && gameDetails.field_time_limit > 0 
        ? Math.max(0, Math.floor(timeLeft / 10))
        : 50;
      const finalPoints = basePoints + moveBonus + timeBonus;
      
      setPoints(finalPoints);

      // Actualizar ranking
      if (gameDetails.drupal_internal__id && !rankingUpdated) {
        setRankingUpdated(true);
        updateRanking(gameDetails.drupal_internal__id, finalPoints).catch((error) => {
          console.warn("No se pudo actualizar el ranking:", error);
        });
      }
    }
  }, [pieces, isGameWon, isGameActive, moves, gameDetails, campaignNid, rankingUpdated, timeLeft]);

  const handlePieceClick = (clickedPieceId: number) => {
    if (!isGameActive || isGameWon) return;
    if (clickedPieceId === totalPieces - 1) return; // No hacer nada si se clickea el espacio vacío

    const clickedPieceIndex = pieces.findIndex((p) => p.id === clickedPieceId);
    if (clickedPieceIndex === -1) return;

    const clickedPiece = pieces[clickedPieceIndex];
    const emptyPieceIndex = pieces.findIndex((p) => p.id === totalPieces - 1);
    if (emptyPieceIndex === -1) return;

    const emptyPiece = pieces[emptyPieceIndex];

    // Verificar si la pieza está adyacente al espacio vacío
    const pieceRow = Math.floor(clickedPiece.currentPosition / cols);
    const pieceCol = clickedPiece.currentPosition % cols;
    const emptyRow = Math.floor(emptyPiece.currentPosition / cols);
    const emptyCol = emptyPiece.currentPosition % cols;

    const isAdjacent =
      (Math.abs(pieceRow - emptyRow) === 1 && pieceCol === emptyCol) ||
      (Math.abs(pieceCol - emptyCol) === 1 && pieceRow === emptyRow);

    if (isAdjacent) {
      const newPieces = [...pieces];
      const tempPosition = clickedPiece.currentPosition;
      newPieces[clickedPieceIndex].currentPosition = emptyPiece.currentPosition;
      newPieces[emptyPieceIndex].currentPosition = tempPosition;

      setPieces(newPieces);
      setMoves((prev) => prev + 1);
    }
  };

  const handleRetry = () => {
    setPieces([]);
    setMoves(0);
    setIsGameWon(false);
    setIsGameActive(true);
    setPoints(0);
    setTimeLeft(gameDetails.field_time_limit || 0);
    setRankingUpdated(false);
    setImageLoaded(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const getPieceStyle = (piece: PuzzlePiece) => {
    const row = Math.floor(piece.correctPosition / cols);
    const col = piece.correctPosition % cols;
    
    // Calcular la posición del fondo de forma precisa
    // Cuando backgroundSize es cols*100% x rows*100%, la imagen se escala
    // Para que cada pieza muestre solo su porción, necesitamos calcular backgroundPosition correctamente
    
    // Con backgroundSize: cols*100% x rows*100%
    // La imagen se escala para que sea cols veces más ancha y rows veces más alta
    // Cada pieza ocupa 1/cols del ancho y 1/rows del alto del contenedor
    
    // Para backgroundPosition con porcentajes cuando la imagen es más grande que el contenedor:
    // El comportamiento es: backgroundPosition: X% significa que el punto X% de la imagen
    // se alinea con el punto X% del contenedor.
    // 
    // Para mostrar la columna 'col' (0-indexed):
    // - La columna col comienza en el (col/cols)*100% de la imagen escalada
    // - Queremos que ese punto se alinee con el 0% del contenedor (borde izquierdo)
    // - Pero backgroundPosition: X% alinea X% de imagen con X% de contenedor
    // 
    // La solución: cuando la imagen es cols*100% de ancho, para que el punto P de la imagen
    // se alinee con el 0% del contenedor, necesitamos usar una fórmula de compensación.
    // 
    // Fórmula correcta considerando el comportamiento de backgroundPosition:
    // Si la imagen es W veces más ancha (W = cols), y queremos mostrar la columna col:
    // bgX = (col / cols) * 100%
    // Pero esto alinea (col/cols)*100% de la imagen con (col/cols)*100% del contenedor
    // 
    // Necesitamos ajustar: cuando la imagen es W veces más ancha, para que el punto P% de la imagen
    // se alinee con el 0% del contenedor, necesitamos usar:
    // bgX = (P / (W - 1)) * 100% cuando W > 1, o 0% cuando W = 1
    // Pero esto tampoco es correcto...
    // 
    // La fórmula que realmente funciona:
    // Para mostrar la columna col de cols columnas, cuando la imagen es cols*100% de ancho:
    // bgX debe ser tal que el inicio de la columna col esté en el borde izquierdo del contenedor
    // Esto se logra con: bgX = (col / cols) * 100%
    // Pero debido a cómo funciona backgroundPosition, necesitamos ajustar:
    const bgX = cols > 1 ? (col / (cols - 1)) * 100 : 0;
    const bgY = rows > 1 ? (row / (rows - 1)) * 100 : 0;

    return {
      backgroundImage: `url(${piece.imageUrl})`,
      backgroundSize: `${cols * 100}% ${rows * 100}%`,
      backgroundPosition: `${bgX}% ${bgY}%`,
      backgroundRepeat: "no-repeat",
    };
  };

  if (!puzzleImage) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-[#2da2eb]/10 via-white to-[#2da2eb]/5 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-white rounded-2xl shadow-lg border border-red-200 p-8 text-center">
            <p className="text-red-500 text-lg">No hay imagen disponible para el rompecabezas</p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-3 bg-[#2da2eb] text-white rounded-xl font-semibold hover:bg-[#2da2eb]/90"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#2da2eb]/10 via-white to-[#2da2eb]/5 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {/* Card unificada con header e instrucciones */}
        <div className="mb-6">
          <div className="bg-white rounded-2xl shadow-lg border border-[#2da2eb]/20 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-[#2da2eb] to-[#1e8bc3] rounded-xl flex items-center justify-center text-2xl shadow-md flex-shrink-0">
                  🧩
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl  text-gray-900">
                    {gameDetails.field_title}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">Rompecabezas</p>
                </div>
              </div>
              <div className="flex gap-3 sm:gap-4">
                {gameDetails.field_time_limit && gameDetails.field_time_limit > 0 ? (
                  <div className="flex items-center gap-2 bg-white rounded-xl border-2 px-4 py-2.5 shadow-sm">
                    <span className="text-lg">⏱️</span>
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500 leading-none">Tiempo</span>
                      <span className={`text-lg  leading-none ${
                        timeLeft < 30 ? "text-red-500" : "text-gray-700"
                      }`}>
                        {formatTime(timeLeft)}
                      </span>
                    </div>
                  </div>
                ) : null}
                <div className="flex items-center gap-2 bg-white rounded-xl border-2 px-4 py-2.5 shadow-sm">
                  <span className="text-lg">🔄</span>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 leading-none">Movimientos</span>
                    <span className="text-lg  text-gray-700 leading-none">
                      {moves}
                    </span>
                  </div>
                </div>
                {isGameWon && (
                  <div className="flex items-center gap-2 bg-gradient-to-br from-[#e6f4ff] to-white rounded-xl border-2 border-[#2da2eb] px-4 py-2.5 shadow-sm">
                    <span className="text-lg">🌟</span>
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500 leading-none">Puntos</span>
                      <span className="text-lg  text-[#2da2eb] leading-none">
                        {points}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Instrucciones */}
            {gameDetails.field_description && gameDetails.field_description.trim() !== "" && (
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#2da2eb] to-[#1e8bc3] rounded-lg flex items-center justify-center text-white shadow-md">
                  <InfoIcon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base  text-[#2da2eb] mb-1.5">
                    Instrucciones
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-sm">
                    {gameDetails.field_description}
                  </p>
                  <p className="text-gray-600 text-sm mt-2">
                    Haz clic en una pieza adyacente al espacio vacío para moverla. 
                    Ordena todas las piezas para completar el rompecabezas.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contenido principal del juego */}
        <div className="flex-1 flex items-center justify-center min-h-[500px]">
          <div className="bg-white rounded-2xl border-2 border-[#2da2eb]/30 shadow-xl p-6 sm:p-8 max-w-6xl w-full">
            {/* Layout con imagen original y rompecabezas */}
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
              {/* Imagen original */}
              <div className="w-full lg:w-auto lg:flex-shrink-0">
                <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">Imagen Original</h3>
                  <div className="relative" style={{ maxWidth: "300px", margin: "0 auto" }}>
                    <Image
                      src={puzzleImage.url}
                      alt={puzzleImage.alt || "Imagen original del rompecabezas"}
                      width={300}
                      height={300}
                      className="rounded-lg shadow-md object-contain w-full h-auto"
                      style={{ aspectRatio: `${cols}/${rows}` }}
                    />
                  </div>
                </div>
              </div>

              {/* Rompecabezas */}
              <div className="flex-1 w-full">
                {/* Resultado del juego */}
                {isGameWon && (
                  <div className="text-center mb-6">
                    <div className="bg-green-50 border-2 border-green-400 rounded-xl p-6 mb-4">
                      <div className="text-5xl mb-2">🎉</div>
                      <h3 className="text-2xl  text-green-700 mb-2">
                        ¡Felicidades!
                      </h3>
                      <p className="text-green-600 mb-2">
                        Has completado el rompecabezas en {moves} movimientos
                      </p>
                      <p className="text-green-600">
                        Has ganado {points} puntos
                      </p>
                      {gameDetails.field_badges?.name && (
                        <p className="text-[#09d6a6] font-bold text-xl mt-4">
                          🏆 Insignia obtenida: <span className="text-purple-600">{gameDetails.field_badges.name}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex gap-4 justify-center">
                      <button
                        onClick={handleRetry}
                        className="px-6 py-3 bg-gradient-to-r from-[#2da2eb] to-[#1e8bc3] text-white rounded-xl text-lg font-semibold shadow-lg hover:from-[#1e8bc3] hover:to-[#2da2eb] transition-all duration-200 transform hover:scale-105"
                      >
                        🔄 Reintentar
                      </button>
                      <button
                        onClick={onClose}
                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl text-lg font-semibold shadow-lg hover:bg-gray-300 transition-all duration-200"
                      >
                        Volver
                      </button>
                    </div>
                  </div>
                )}

                {!isGameActive && !isGameWon && gameDetails.field_time_limit && gameDetails.field_time_limit > 0 && (
                  <div className="text-center mb-6">
                    <div className="bg-red-50 border-2 border-red-400 rounded-xl p-6 mb-4">
                      <div className="text-5xl mb-2">⏱️</div>
                      <h3 className="text-2xl  text-red-700 mb-2">
                        ¡Tiempo agotado!
                      </h3>
                      <p className="text-red-600 mb-4">
                        Has realizado {moves} movimientos
                      </p>
                      <button
                        onClick={handleRetry}
                        className="px-6 py-3 bg-gradient-to-r from-[#2da2eb] to-[#1e8bc3] text-white rounded-xl text-lg font-semibold shadow-lg hover:from-[#1e8bc3] hover:to-[#2da2eb] transition-all duration-200 transform hover:scale-105"
                      >
                        🔄 Reintentar
                      </button>
                    </div>
                  </div>
                )}

            {/* Imagen oculta para cargar */}
            <div className="hidden">
              <img
                ref={imageRef}
                src={puzzleImage.url}
                alt="Puzzle"
                onLoad={() => setImageLoaded(true)}
              />
            </div>

            {/* Grid del rompecabezas */}
            {pieces.length > 0 && (
              <div
                ref={containerRef}
                className="mx-auto"
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${cols}, 1fr)`,
                  gap: "0px",
                  maxWidth: "600px",
                  width: "100%",
                  aspectRatio: `${cols}/${rows}`,
                }}
              >
                {Array.from({ length: totalPieces }, (_, position) => {
                  const piece = pieces.find((p) => p.currentPosition === position);
                  
                  // Si no hay pieza en esta posición, es el espacio vacío
                  if (!piece || piece.id === totalPieces - 1) {
                    return (
                      <div
                        key={`empty-${position}`}
                        className="bg-gray-200 border-2 border-dashed border-gray-400 rounded"
                        style={{ 
                          aspectRatio: "1",
                          width: "100%",
                          height: "100%",
                        }}
                      />
                    );
                  }

                  const row = Math.floor(position / cols);
                  const col = position % cols;
                  const emptyPiece = pieces.find((p) => p.id === totalPieces - 1);
                  const emptyRow = emptyPiece ? Math.floor(emptyPiece.currentPosition / cols) : -1;
                  const emptyCol = emptyPiece ? emptyPiece.currentPosition % cols : -1;
                  
                  const isAdjacentToEmpty =
                    (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
                    (Math.abs(col - emptyCol) === 1 && row === emptyRow);

                  return (
                    <div
                      key={piece.id}
                      onClick={() => handlePieceClick(piece.id)}
                      className={`border-2 rounded transition-all duration-200 overflow-hidden ${
                        isAdjacentToEmpty && isGameActive && !isGameWon
                          ? "cursor-pointer hover:scale-105 hover:shadow-lg border-[#2da2eb]"
                          : piece.currentPosition === piece.correctPosition
                          ? "border-green-500"
                          : "border-gray-300 cursor-not-allowed opacity-90"
                      }`}
                      style={{
                        ...getPieceStyle(piece),
                        aspectRatio: "1",
                        width: "100%",
                        height: "100%",
                        backgroundClip: "padding-box",
                        backgroundOrigin: "padding-box",
                        imageRendering: "crisp-edges",
                      }}
                    />
                  );
                })}
              </div>
            )}

            {pieces.length === 0 && imageLoaded && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2da2eb] mx-auto mb-4"></div>
                <p className="text-gray-500">Preparando rompecabezas...</p>
              </div>
            )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

