"use client";

import { useState, useEffect, useRef } from "react";
import { CompletePhraseGameDetails } from "@/types/games";
import { updateRanking } from "@/services/games/update-ranking";
import { InfoIcon } from "lucide-react";

interface CompletePhraseGameProps {
  gameDetails: CompletePhraseGameDetails;
  onClose: () => void;
  campaignNid?: number;
}

export default function CompletePhraseGame({
  gameDetails,
  onClose,
  campaignNid,
}: CompletePhraseGameProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [points, setPoints] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(
    gameDetails.field_time_limit || 0
  );
  const [isGameActive, setIsGameActive] = useState<boolean>(true);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [rankingUpdated, setRankingUpdated] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Mezclar las opciones de respuesta
  const answers = [
    gameDetails.field_correct_answer,
    gameDetails.field_incorrect_answer_1,
    gameDetails.field_incorrect_answer_2,
  ].sort(() => Math.random() - 0.5);

  useEffect(() => {
    if (
      gameDetails.field_time_limit &&
      gameDetails.field_time_limit > 0 &&
      timeLeft > 0 &&
      isGameActive &&
      !isAnswered
    ) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsGameActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [gameDetails.field_time_limit, timeLeft, isGameActive, isAnswered]);

  const handleAnswerSelect = async (answer: string) => {
    if (isAnswered || !isGameActive) return;

    setSelectedAnswer(answer);
    setIsAnswered(true);
    setIsGameActive(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const correct =
      answer.toLowerCase().trim() ===
      gameDetails.field_correct_answer.toLowerCase().trim();
    setIsCorrect(correct);

    if (correct) {
      setPoints(gameDetails.field_points || 0);

      // Actualizar ranking si la respuesta es correcta
      // Manejo silencioso del error - el juego continúa funcionando incluso si falla
      if (gameDetails.drupal_internal__id && !rankingUpdated) {
        setRankingUpdated(true);
        const finalPoints = gameDetails.field_points || 0;
        updateRanking(gameDetails.drupal_internal__id, finalPoints).catch(
          (error) => {
            // Error silencioso - solo se registra en consola, no interrumpe la experiencia
            console.warn(
              "No se pudo actualizar el ranking (esto no afecta tu puntuación):",
              error
            );
          }
        );
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
    setSelectedAnswer(null);
    setIsAnswered(false);
    setIsCorrect(false);
    setPoints(0);
    setTimeLeft(gameDetails.field_time_limit || 0);
    setIsGameActive(true);
    setShowHint(false);
    setRankingUpdated(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  // Extraer el placeholder de la frase
  const getPlaceholderPosition = () => {
    const phrase = gameDetails.field_phrase_to_complete;
    const placeholderMatch = phrase.match(/_+/);
    if (placeholderMatch) {
      const placeholder = placeholderMatch[0];
      const parts = phrase.split(placeholder);
      return { before: parts[0], after: parts[1] || "" };
    }
    return { before: phrase, after: "" };
  };

  const { before, after } = getPlaceholderPosition();

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#e6fff2]/40 via-white to-[#e6fff2]/20 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {/* Card unificada con header e instrucciones */}
        <div className="mb-6">
          <div className="bg-white rounded-2xl shadow-lg border border-[#09d6a6]/20 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-[#09d6a6] to-[#0bc9a0] rounded-xl flex items-center justify-center text-2xl shadow-md flex-shrink-0">
                  📝
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl  text-gray-900">
                    {gameDetails.field_title}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Completa la Frase
                  </p>
                </div>
              </div>
              <div className="flex gap-3 sm:gap-4">
                {gameDetails.field_time_limit &&
                  gameDetails.field_time_limit > 0 && (
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
            {gameDetails.field_description &&
              gameDetails.field_description.trim() !== "" && (
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#09d6a6] to-[#0bc9a0] rounded-lg flex items-center justify-center text-white shadow-md">
                    <InfoIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base  text-[#09d6a6] mb-1.5">
                      Instrucciones
                    </h3>
                    <p className="text-gray-700 leading-relaxed text-sm">
                      {gameDetails.field_description}
                    </p>
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Contenido principal del juego */}
        <div className="flex-1 flex items-center justify-center min-h-[500px]">
          <div className="bg-white rounded-2xl border-2 border-[#09d6a6]/30 shadow-xl p-6 sm:p-8 max-w-4xl w-full">
            {/* Frase a completar - Mejorado */}
            <div className="mb-8">
              <div className="bg-gradient-to-br from-[#e6fff2]/50 to-white rounded-xl p-6 sm:p-8 border border-[#09d6a6]/20">
                <div className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-800 text-center leading-relaxed">
                  <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
                    <span className="text-gray-900">{before.trim()}</span>
                    <span className="inline-block px-5 sm:px-7 py-4 bg-white border-2 border-[#09d6a6] rounded-xl min-w-[140px] sm:min-w-[180px] text-center shadow-lg">
                      {isAnswered && isCorrect ? (
                        <span className="text-[#09d6a6]  text-xl sm:text-2xl">
                          {gameDetails.field_correct_answer}
                        </span>
                      ) : isAnswered && !isCorrect && selectedAnswer ? (
                        <div className="space-y-2">
                          <span className="text-red-500 line-through block text-lg">
                            {selectedAnswer}
                          </span>
                          <span className="text-[#09d6a6]  block text-xl border-t border-[#09d6a6]/30 pt-2">
                            {gameDetails.field_correct_answer}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xl sm:text-2xl font-mono ">
                          ____
                        </span>
                      )}
                    </span>
                    {after && after.trim() && (
                      <span className="text-gray-900">{after.trim()}</span>
                    )}
                  </div>
                </div>
                {!isAnswered && (
                  <p className="text-sm text-gray-600 mt-4 text-center">
                    Selecciona la palabra que completa la frase
                  </p>
                )}
              </div>
            </div>

            {/* Opciones de respuesta - Mejorado */}
            {!isAnswered && (
              <div className="space-y-5 mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-5 text-center">
                  Selecciona la palabra correcta:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {answers.map((answer, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(answer)}
                      className="px-6 py-5 bg-gradient-to-r from-[#09d6a6] to-[#0bc9a0] text-white rounded-xl text-base sm:text-lg font-semibold shadow-lg hover:from-[#0bc9a0] hover:to-[#0dbc9a] transition-all duration-200 transform hover:scale-105 hover:shadow-xl active:scale-95"
                    >
                      {answer}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Resultado - Mejorado */}
            {isAnswered && (
              <div className="text-center mb-6">
                {isCorrect ? (
                  <div className="bg-gradient-to-br from-[#e6fff2] to-white border-2 border-[#09d6a6] rounded-xl p-8 mb-4 shadow-lg">
                    <div className="text-6xl mb-3">🎉</div>
                    <h3 className="text-3xl  text-[#09d6a6] mb-3">
                      ¡Correcto!
                    </h3>
                    <p className="text-lg text-gray-700 mb-4">
                      Has ganado{" "}
                      <strong className="text-[#09d6a6] text-xl">
                        {points}
                      </strong>{" "}
                      puntos
                    </p>
                    {gameDetails.field_badges?.name && (
                      <p className="text-[#09d6a6] font-bold text-xl mb-4">
                        🏆 Insignia obtenida: <span className="text-purple-600">{gameDetails.field_badges.name}</span>
                      </p>
                    )}
                    <div className="flex gap-4 justify-center mt-6">
                      <button
                        onClick={handleRetry}
                        className="px-6 py-3 bg-gradient-to-r from-[#09d6a6] to-[#0bc9a0] text-white rounded-xl text-base font-semibold shadow-lg hover:from-[#0bc9a0] hover:to-[#0dbc9a] transition-all duration-200 transform hover:scale-105"
                      >
                        🔄 Jugar de Nuevo
                      </button>
                      <button
                        onClick={onClose}
                        className="px-6 py-3 bg-white text-gray-700 rounded-xl text-base font-medium hover:bg-[#e4fef1] transition-all duration-200 border-2 border-gray-200 shadow-sm"
                      >
                        ← Volver
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 border-2 border-red-400 rounded-xl p-8 mb-4 shadow-lg">
                    <div className="text-6xl mb-3">❌</div>
                    <h3 className="text-3xl  text-red-700 mb-3">
                      Incorrecto
                    </h3>
                    <p className="text-lg text-red-600 mb-6">
                      Tu respuesta no fue correcta. ¡Inténtalo de nuevo!
                    </p>
                    <div className="flex gap-4 justify-center">
                      <button
                        onClick={handleRetry}
                        className="px-6 py-3 bg-gradient-to-r from-[#09d6a6] to-[#0bc9a0] text-white rounded-xl text-base font-semibold shadow-lg hover:from-[#0bc9a0] hover:to-[#0dbc9a] transition-all duration-200 transform hover:scale-105"
                      >
                        🔄 Reintentar
                      </button>
                      <button
                        onClick={onClose}
                        className="px-6 py-3 bg-white text-gray-700 rounded-xl text-base font-medium hover:bg-[#e4fef1] transition-all duration-200 border-2 border-gray-200 shadow-sm"
                      >
                        ← Volver
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pista - Mejorado */}
            {gameDetails.field_hint && !isAnswered && (
              <div className="mb-6">
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="w-full px-4 py-3 bg-gradient-to-br from-[#e6fff2] to-white border-2 border-[#09d6a6]/50 text-[#09d6a6] rounded-lg hover:bg-[#e6fff2] transition-colors font-medium shadow-sm"
                >
                  {showHint ? "Ocultar" : "Mostrar"} pista 💡
                </button>
                {showHint && (
                  <div className="mt-4 p-5 bg-gradient-to-br from-[#e6fff2] to-white border-2 border-[#09d6a6]/30 rounded-lg shadow-sm">
                    <p className="text-gray-800 text-base">
                      <strong className="text-[#09d6a6]">Pista:</strong>{" "}
                      {gameDetails.field_hint}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {/* Botón para volver - Solo si no hay respuesta */}
        {!isAnswered && (
          <div className="text-center mt-4">
            <button
              onClick={onClose}
              className="px-6 sm:px-8 py-3 bg-white text-gray-700 rounded-xl text-base sm:text-lg font-medium hover:bg-[#e4fef1] transition-all duration-200 border-2 border-gray-200 shadow-sm"
            >
              ← Volver a la Campaña
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
