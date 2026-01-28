"use client";

import { useState, useEffect, useRef } from "react";
import WordGrid from "./WordGrid";
import GameInstructions from "./GameInstructions";
import { GameConfig } from "@/types/games";
import { updateRanking } from "@/services/games/update-ranking";
import { InfoIcon } from "lucide-react";

interface FoundWordData {
  word: string;
  positions: { row: number; col: number }[];
  color: string;
}

const WORD_COLORS = [
  "#09d6a6",
  "#0bc9a0",
  "#0dbc9a",
  "#0faf94",
  "#12a28e",
  "#159588",
  "#188882",
  "#1b7b7c",
  "#1e6e76",
  "#216170",
  "#24546a",
  "#274764",
];

interface WordSearchGameProps {
  config: GameConfig;
  onClose: () => void;
  campaignNid?: number;
}

export default function WordSearchGame({
  config,
  onClose,
  campaignNid,
}: WordSearchGameProps) {
  const [foundWordsSet, setFoundWordsSet] = useState<Set<string>>(new Set());
  const [foundWordsData, setFoundWordsData] = useState<FoundWordData[]>([]);
  const [points, setPoints] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(config.timeLimit);
  const [currentWords, setCurrentWords] = useState<string[]>(config.words);
  const [isGameActive, setIsGameActive] = useState<boolean>(true);
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [rankingUpdated, setRankingUpdated] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setCurrentWords(config.words);
  }, [config.words]);

  useEffect(() => {
    if (config.timeLimit > 0 && timeLeft > 0 && isGameActive) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsGameActive(false);
            setShowWarning(false);
            return 0;
          }
          if (prev === 31) {
            setShowWarning(true);
            setTimeout(() => setShowWarning(false), 5000);
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [config.timeLimit, timeLeft, isGameActive]);

  const handleWordFound = async (
    word: string,
    positions: { row: number; col: number }[]
  ) => {
    if (!isGameActive) return;

    if (!foundWordsSet.has(word)) {
      const color = WORD_COLORS[foundWordsData.length % WORD_COLORS.length];
      const newFoundSet = new Set(foundWordsSet);
      newFoundSet.add(word);

      setFoundWordsSet(newFoundSet);
      const newFoundData = [...foundWordsData, { word, positions, color }];

      setFoundWordsData(newFoundData);
      setPoints((prev) => prev + config.pointsPerWord);

      if (newFoundSet.size === config.words.length) {
        setIsGameActive(false);

        // Actualizar ranking si se completó el juego y hay un nid de campaña
        // Manejo silencioso del error - el juego continúa funcionando incluso si falla
        if (config.gameId && !rankingUpdated) {
          setRankingUpdated(true);
          const finalPoints = points + config.pointsPerWord;
          updateRanking(config.gameId, finalPoints).catch((error) => {
            // Error silencioso - solo se registra en consola, no interrumpe la experiencia
            console.warn(
              "No se pudo actualizar el ranking (esto no afecta tu puntuación):",
              error
            );
          });
        }
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Función para reiniciar el juego
  const handleRetry = () => {
    setFoundWordsSet(new Set());
    setFoundWordsData([]);
    setPoints(0);
    setTimeLeft(config.timeLimit);
    setCurrentWords(config.words);
    setIsGameActive(true);
    setShowWarning(false);
    setRankingUpdated(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const getCompletionMessage = () => {
    if (foundWordsSet.size === config.words.length) {
      return {
        title: "¡Increíble! Has completado el juego",
        message: "¡Eres un maestro de las palabras!",
        color: "#09d6a6",
      };
    } else {
      return {
        title: "¡Tiempo terminado!",
        message: `Encontraste ${foundWordsSet.size} de ${config.words.length} palabras`,
        color: "#09d6a6",
      };
    }
  };

  const completionData = getCompletionMessage();

  // gridSize ya viene como número del config
  const gridSize = config.gridSize;

  return (
    <div className="min-h-screen w-full  py-6">
      {showWarning && (
        <div className="fixed top-0 left-0 right-0 z-[2000] bg-[#09d6a6] text-white text-center py-3 px-4 rounded-b-2xl animate-bounce shadow-lg font-semibold">
          ¡Atención! Quedan solo <strong>30 segundos</strong> para encontrar más
          palabras. ¡Dale con todo! 🚀
        </div>
      )}

      <div
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${
          showWarning ? "pt-20" : "pt-4"
        }`}
      >
        {/* Card unificada con header e instrucciones */}
        <div className="mb-6">
          <div className="bg-white rounded-2xl shadow-lg border border-[#09d6a6]/20 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-[#09d6a6] to-[#0bc9a0] rounded-xl flex items-center justify-center text-2xl shadow-md flex-shrink-0">
                  🎯
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl  text-gray-900">
                    {config.title}
                  </h1>
                </div>
              </div>
              <div className="flex gap-3 sm:gap-4">
                {config.timeLimit > 0 && (
                  <div className="flex items-center gap-2 bg-white rounded-xl border-2 px-4 py-2.5 shadow-sm">
                    <span className="text-lg">⏱️</span>
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500 leading-none">
                        Tiempo
                      </span>
                      <span
                        className={`text-lg  leading-none ${
                          timeLeft <= 30
                            ? "text-red-600 animate-pulse"
                            : timeLeft <= 60
                            ? "text-orange-600"
                            : "text-[#09d6a6]"
                        }`}
                      >
                        {formatTime(timeLeft)}
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-gradient-to-br from-[#e6fff2] to-white rounded-xl border-2 border-[#09d6a6] px-4 py-2.5 shadow-sm">
                  <span className="text-lg">🌟</span>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 leading-none">
                      Puntos
                    </span>
                    <span className="text-lg  text-[#09d6a6] leading-none">
                      {points}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Instrucciones */}
            {config.description && config.description.trim() !== "" && (
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#09d6a6] to-[#0bc9a0] rounded-lg flex items-center justify-center text-white text-xl  shadow-md">
                  <InfoIcon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base  text-[#09d6a6] mb-1.5">
                    Instrucciones
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-sm">
                    {config.description}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {!isGameActive ? (
          <div className="mt-6">
            <div className="bg-white rounded-2xl shadow-xl border-2 border-[#09d6a6] p-8 sm:p-12 text-center max-w-2xl mx-auto">
              <div className="text-6xl mb-6">🎉</div>
              <h2 className="text-3xl sm:text-4xl  text-[#09d6a6] mb-4">
                {completionData.title}
              </h2>
              <p className="text-lg text-gray-700 mb-8">
                {completionData.message}
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8 max-w-md mx-auto">
                <div className="bg-gradient-to-br from-[#e6fff2] to-white p-6 rounded-xl border-2 border-[#09d6a6]/30">
                  <div className="text-sm text-gray-600 mb-2">
                    Puntaje Final
                  </div>
                  <div className="text-3xl  text-[#09d6a6]">
                    {points}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-[#e6fff2] to-white p-6 rounded-xl border-2 border-[#09d6a6]/30">
                  <div className="text-sm text-gray-600 mb-2">Palabras</div>
                  <div className="text-3xl  text-[#09d6a6]">
                    {foundWordsSet.size}/{config.words.length}
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleRetry}
                  className="px-8 py-3 bg-gradient-to-r from-[#09d6a6] to-[#0bc9a0] text-white rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  🔄 Jugar de Nuevo
                </button>
                <button
                  onClick={onClose}
                  className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl text-lg font-semibold hover:bg-gray-200 transition-all duration-200 border-2 border-gray-200"
                >
                  ← Volver
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 h-full">
            {/* Grilla principal */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg border border-[#09d6a6]/20 p-4 sm:p-6">
                {currentWords.length > 0 ? (
                  <WordGrid
                    words={currentWords}
                    gridSize={gridSize}
                    directions={config.directions}
                    onWordFound={handleWordFound}
                    foundWordsData={foundWordsData}
                    difficulty={config.difficulty}
                  />
                ) : null}
              </div>
            </div>

            {/* Panel de palabras */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg border border-[#09d6a6]/20 p-6   h-full top-6">
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <h3 className="text-lg  text-gray-900 flex items-center gap-2">
                    <span className="text-[#09d6a6]">📝</span>
                    Palabras a encontrar
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {foundWordsSet.size} de {config.words.length} encontradas
                  </p>
                </div>
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                  {currentWords.map((word) => (
                    <div
                      key={word}
                      className={`px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                        foundWordsSet.has(word)
                          ? "bg-[#e6fff2] border-[#09d6a6] text-gray-600"
                          : "bg-gray-50 border-gray-200 text-gray-900 hover:border-[#09d6a6]/50 hover:bg-[#e6fff2]/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-semibold text-base ${
                            foundWordsSet.has(word) ? "line-through" : ""
                          }`}
                        >
                          {word}
                        </span>
                        {foundWordsSet.has(word) && (
                          <span className="text-[#09d6a6] text-lg">✓</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {isGameActive && (
          <div className="mt-6 text-center">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-white text-gray-700 rounded-xl text-base font-medium hover:bg-[#e4fef1] transition-all duration-200 border-2 border-gray-200 shadow-sm"
            >
              ← Volver a la Campaña
            </button>
          </div>
        )}

        {/* Confeti de celebración */}
        {!isGameActive && foundWordsSet.size === config.words.length && (
          <div className="fixed top-0 left-0 right-0 bottom-0 pointer-events-none z-[1000] overflow-hidden">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full animate-ping"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  width: `${10 + Math.random() * 10}px`,
                  height: `${10 + Math.random() * 10}px`,
                  backgroundColor:
                    WORD_COLORS[Math.floor(Math.random() * WORD_COLORS.length)],
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${3 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
