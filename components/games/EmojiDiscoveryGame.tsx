"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { EmojiDiscoveryGameDetails } from "@/types/games";
import { updateRanking } from "@/services/games/update-ranking";
import { InfoIcon } from "lucide-react";

interface EmojiDiscoveryGameProps {
  gameDetails: EmojiDiscoveryGameDetails;
  onClose: () => void;
  campaignNid?: number;
}

export default function EmojiDiscoveryGame({
  gameDetails,
  onClose,
  campaignNid,
}: EmojiDiscoveryGameProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [correctAnswers, setCorrectAnswers] = useState<number>(0);
  const [points, setPoints] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(gameDetails.field_time_limit || 0);
  const [isGameActive, setIsGameActive] = useState<boolean>(true);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [rankingUpdated, setRankingUpdated] = useState<boolean>(false);
  const [hasClaimedPoints, setHasClaimedPoints] = useState<boolean>(false);
  const [finishedThisSession, setFinishedThisSession] = useState<boolean>(false);
  const [lastEarnedPoints, setLastEarnedPoints] = useState<number>(0);
  const [timeExpired, setTimeExpired] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pointsRef = useRef<number>(0);

  useEffect(() => {
    pointsRef.current = points;
  }, [points]);

  // Obtener las preguntas (emoji items)
  const questions = gameDetails.field_emojis || [];
  const currentQuestion = questions[currentQuestionIndex] || null;
  const totalQuestions = questions.length;
  const isGameComplete = currentQuestionIndex >= totalQuestions;
  const completionStorageKey = useMemo(() => {
    if (!campaignNid || !gameDetails.drupal_internal__id) return null;
    return `emoji_discovery_${campaignNid}_${gameDetails.drupal_internal__id}_completed`;
  }, [campaignNid, gameDetails.drupal_internal__id]);
  const isGameLocked = hasClaimedPoints && !finishedThisSession;
  const totalPointsAvailable = gameDetails.field_points ?? 0;
  const { basePointsPerQuestion, remainderPoints } = useMemo(() => {
    if (!totalPointsAvailable || totalQuestions === 0) {
      return { basePointsPerQuestion: 0, remainderPoints: 0 };
    }
    return {
      basePointsPerQuestion: Math.floor(totalPointsAvailable / totalQuestions),
      remainderPoints: totalPointsAvailable % totalQuestions,
    };
  }, [totalPointsAvailable, totalQuestions]);
  const getPointsForQuestion = useCallback(
    (index: number) => {
      if (!totalPointsAvailable || totalQuestions === 0) return 0;
      return basePointsPerQuestion + (index < remainderPoints ? 1 : 0);
    },
    [basePointsPerQuestion, remainderPoints, totalPointsAvailable, totalQuestions]
  );

  // Mezclar las opciones de respuesta para cada pregunta
  const getShuffledAnswers = (question: typeof currentQuestion): string[] => {
    if (!question || !question.field_correct_answer) return [];
    
    const answers = [
      question.field_correct_answer,
      question.field_incorrect_1,
      question.field_incorrect_2,
      question.field_incorrect_3,
      question.field_incorrect_4,
    ].filter((answer): answer is string => !!answer);
    
    return answers.sort(() => Math.random() - 0.5);
  };

  const [shuffledAnswers, setShuffledAnswers] = useState<string[]>(() => 
    getShuffledAnswers(currentQuestion)
  );

  // Actualizar respuestas mezcladas cuando cambia la pregunta
  useEffect(() => {
    if (currentQuestion) {
      setShuffledAnswers(getShuffledAnswers(currentQuestion));
    }
  }, [currentQuestionIndex, currentQuestion]);

  const handleGameCompletion = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setFinishedThisSession(true);
    setIsGameActive(false);
    setIsAnswered(false);
    setSelectedAnswer(null);
    setShowHint(false);
    setCurrentQuestionIndex(totalQuestions);

    const earnedPoints = pointsRef.current;

    if (earnedPoints > 0 && completionStorageKey && typeof window !== "undefined") {
      window.localStorage.setItem(completionStorageKey, "claimed");
      setHasClaimedPoints(true);
    }

    if (gameDetails.drupal_internal__id && !rankingUpdated) {
      setRankingUpdated(true);
      updateRanking(gameDetails.drupal_internal__id, earnedPoints).catch((error) => {
        console.warn("No se pudo actualizar el ranking (esto no afecta tu puntuación):", error);
      });
    }
  }, [
    completionStorageKey,
    gameDetails.drupal_internal__id,
    rankingUpdated,
    totalQuestions,
  ]);

  useEffect(() => {
    if (isGameLocked) return;
    if (gameDetails.field_time_limit && gameDetails.field_time_limit > 0 && timeLeft > 0 && isGameActive && !isAnswered && !isGameComplete) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsGameActive(false);
            setTimeExpired(true);
            setIsAnswered(true);
            // Avanzar a la siguiente pregunta cuando se acaba el tiempo después de mostrar el mensaje
            if (currentQuestionIndex < totalQuestions - 1) {
              setTimeout(() => {
                handleNextQuestion();
              }, 3000); // Aumentar a 3 segundos para que se vea el mensaje
            } else {
              // Si es la última pregunta, completar el juego después de mostrar el mensaje
              setTimeout(() => {
                handleGameCompletion();
              }, 3000);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [gameDetails.field_time_limit, timeLeft, isGameActive, isAnswered, currentQuestionIndex, totalQuestions, isGameComplete, isGameLocked, handleGameCompletion]);

  useEffect(() => {
    if (!completionStorageKey || typeof window === "undefined") return;
    const storedValue = window.localStorage.getItem(completionStorageKey);
    if (storedValue === "claimed") {
      setHasClaimedPoints(true);
      setIsGameActive(false);
    }
  }, [completionStorageKey]);

  const handleAnswerSelect = (answer: string) => {
    if (isAnswered || !isGameActive || !currentQuestion || isGameLocked) return;

    setSelectedAnswer(answer);
    setIsAnswered(true);
    setIsGameActive(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const isCorrect = answer.toLowerCase().trim() === (currentQuestion.field_correct_answer || "").toLowerCase().trim();
    const questionPoints = isCorrect ? getPointsForQuestion(currentQuestionIndex) : 0;

    if (isCorrect) {
      setPoints((prev) => prev + questionPoints);
      setLastEarnedPoints(questionPoints);
    } else {
      setLastEarnedPoints(0);
    }

    // Avanzar a la siguiente pregunta después de 2 segundos
    setTimeout(() => {
      if (isCorrect) {
        setCorrectAnswers((prev) => prev + 1);
      }

      if (currentQuestionIndex < totalQuestions - 1) {
        handleNextQuestion();
      } else {
        handleGameCompletion();
      }
    }, 2000);
  };

  const handleNextQuestion = () => {
    setCurrentQuestionIndex((prev) => prev + 1);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setIsGameActive(true);
    setShowHint(false);
    setLastEarnedPoints(0);
    setTimeExpired(false);
    
    // Reiniciar el temporizador si hay tiempo límite por pregunta
    if (gameDetails.field_time_limit && gameDetails.field_time_limit > 0) {
      setTimeLeft(gameDetails.field_time_limit);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Función para reiniciar el juego
  const handleRetry = () => {
    if (isGameLocked) return;
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setCorrectAnswers(0);
    setPoints(0);
    pointsRef.current = 0;
    setTimeLeft(gameDetails.field_time_limit || 0);
    setIsGameActive(true);
    setShowHint(false);
    setRankingUpdated(false);
    setFinishedThisSession(false);
    setLastEarnedPoints(0);
    setTimeExpired(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  // Obtener los emojis de la pregunta actual
  const getEmojis = (): string[] => {
    if (!currentQuestion || !currentQuestion.field_emoji) return [];
    
    const text = currentQuestion.field_emoji;
    const emojiArray: string[] = [];
    
    // Usar Array.from() para manejar correctamente los surrogate pairs
    // Esto divide la cadena en caracteres Unicode completos (no en bytes)
    const chars = Array.from(text);
    
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      const codePoint = char.codePointAt(0);
      
      if (codePoint) {
        // Verificar si es un emoji basado en rangos Unicode conocidos
        // Incluye el rango U+2300-U+23FF que contiene ⏰ (U+23F0)
        const isEmoji = 
          (codePoint >= 0x1F300 && codePoint <= 0x1F9FF) || // Emojis varios
          (codePoint >= 0x1F600 && codePoint <= 0x1F64F) || // Emoticones
          (codePoint >= 0x1F680 && codePoint <= 0x1F6FF) || // Transporte y mapas
          (codePoint >= 0x2600 && codePoint <= 0x26FF) ||   // Símbolos misceláneos
          (codePoint >= 0x2700 && codePoint <= 0x27BF) ||   // Dingbats
          (codePoint >= 0x2300 && codePoint <= 0x23FF) ||  // Símbolos técnicos misceláneos (incluye ⏰ U+23F0)
          (codePoint >= 0x2190 && codePoint <= 0x21FF) ||  // Flechas
          (codePoint >= 0x2B00 && codePoint <= 0x2BFF) ||   // Símbolos y flechas misceláneos
          (codePoint >= 0x1F1E0 && codePoint <= 0x1F1FF);   // Banderas
        
        if (isEmoji) {
          // Verificar si hay un variation selector (FE0F) después del emoji
          if (i + 1 < chars.length) {
            const nextChar = chars[i + 1];
            const nextCodePoint = nextChar.codePointAt(0);
            if (nextCodePoint === 0xFE0F) {
              // Es un emoji con variation selector, incluir ambos
              emojiArray.push(char + nextChar);
              i++; // Saltar el variation selector
            } else {
              emojiArray.push(char);
            }
          } else {
            emojiArray.push(char);
          }
        }
      }
    }
    
    return emojiArray;
  };

  const emojis = getEmojis();

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
                  😊
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl  text-gray-900">
                    {gameDetails.field_title?.trim() || "Descubrir Emoji"}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">Descubrir Emoji</p>
                </div>
              </div>
              <div className="flex gap-3 sm:gap-4">
                {gameDetails.field_time_limit && gameDetails.field_time_limit > 0 && (
                  <div className="flex items-center gap-2 bg-white rounded-xl border-2 px-4 py-2.5 shadow-sm">
                    <span className="text-lg">⏱️</span>
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500 leading-none">Tiempo</span>
                      <span
                        className={`text-lg font-bold leading-none ${
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
                    <span className="text-xs text-gray-500 leading-none">Puntos</span>
                    <span className="text-lg font-bold text-[#09d6a6] leading-none">
                      {points}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Instrucciones */}
            {gameDetails.field_description && gameDetails.field_description.trim() !== "" && (
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#09d6a6] to-[#0bc9a0] rounded-lg flex items-center justify-center text-white shadow-md">
                  <InfoIcon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base  text-[#09d6a6] mb-1.5">
                    Instrucciones
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-sm">{gameDetails.field_description}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contenido principal del juego */}
        <div className="flex-1 flex items-center justify-center min-h-[500px]">
          <div className="bg-white rounded-2xl border-2 border-[#09d6a6]/30 shadow-xl p-6 sm:p-8 max-w-4xl w-full">
          {isGameLocked ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔒</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                Ya reclamaste tus puntos
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Solo puedes sumar puntos en este reto una vez por persona. Explora otros juegos para seguir acumulando.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-500 text-white rounded-full text-lg font-semibold shadow-lg hover:bg-gray-600 transition-all duration-200"
              >
                ← Volver a la Campaña
              </button>
            </div>
          ) : isGameComplete ? (
            // Resultado final
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-400 rounded-xl p-8 mb-6">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl font-bold text-green-700 mb-4">
                  ¡Juego Completado!
                </h2>
                <div className="space-y-3 text-lg">
                  <p className="text-gray-700">
                    <strong>Respuestas correctas:</strong> {correctAnswers} de {totalQuestions}
                  </p>
                  <p className="text-gray-700">
                    <strong>Porcentaje:</strong> {Math.round((correctAnswers / totalQuestions) * 100)}%
                  </p>
                  {points > 0 && (
                    <p className="text-purple-600 font-bold text-xl mt-4">
                      Has ganado {points} {points === 1 ? "punto" : "puntos"}
                    </p>
                  )}
                  {gameDetails.field_badges?.name && (
                    <p className="text-[#09d6a6] font-bold text-xl mt-4">
                      🏆 Insignia obtenida: <span className="text-purple-600">{gameDetails.field_badges.name}</span>
                    </p>
                  )}
                  {hasClaimedPoints && (
                    <p className="text-sm text-gray-600 mt-2">
                      Ya no podrás volver a jugar este reto para sumar más puntos.
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-4 justify-center mt-6">
                {!hasClaimedPoints && (
                  <button
                    onClick={handleRetry}
                    className="px-6 py-3 bg-gradient-to-r from-[#09d6a6] to-[#0bc9a0] text-white rounded-xl text-lg font-semibold shadow-lg hover:from-[#0bc9a0] hover:to-[#0dbc9a] transition-all duration-200 transform hover:scale-105"
                  >
                    🔄 Jugar de Nuevo
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-500 text-white rounded-full text-lg font-semibold shadow-lg hover:bg-gray-600 transition-all duration-200"
                >
                  ← Volver a la Campaña
                </button>
              </div>
            </div>
          ) : currentQuestion ? (
            <>
              {/* Emojis a descubrir - Mejorado */}
              <div className="mb-8 text-center">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-gradient-to-r from-[#09d6a6] to-[#0bc9a0] text-white px-4 py-2 rounded-lg font-bold text-lg">
                    Pregunta {currentQuestionIndex + 1}
                  </span>
                </div>
                <div className="bg-gradient-to-br from-[#e6fff2]/50 to-white rounded-xl p-6 sm:p-8 border border-[#09d6a6]/20 mb-6">
                  {currentQuestion.field_question_phrase && (
                    <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-6">
                      {currentQuestion.field_question_phrase}
                    </h3>
                  )}
                  <div className="flex justify-center gap-4 sm:gap-6 flex-wrap">
                    {emojis.length > 0 ? (
                      emojis.map((emoji, index) => (
                        <div
                          key={index}
                          className="text-5xl sm:text-6xl md:text-7xl p-5 sm:p-6 bg-white rounded-xl border-2 border-[#09d6a6] shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
                        >
                          {emoji}
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500">No hay emojis disponibles</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Opciones de respuesta - Mejorado */}
              {!isAnswered && (
                <div className="space-y-5 mb-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-5 text-center">
                    Selecciona la respuesta correcta:
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {shuffledAnswers.map((answer, index) => (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(answer)}
                        disabled={isAnswered || !isGameActive}
                        className="px-6 py-5 bg-gradient-to-r from-[#09d6a6] to-[#0bc9a0] text-white rounded-xl text-base sm:text-lg font-semibold shadow-lg hover:from-[#0bc9a0] hover:to-[#0dbc9a] transition-all duration-200 transform hover:scale-105 hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  {timeExpired ? (
                    <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-400 rounded-xl p-8 mb-4 shadow-lg">
                      <div className="text-6xl mb-3">⏰</div>
                      <h3 className="text-3xl font-bold text-orange-700 mb-3">
                        ¡Se te acabó el tiempo!
                      </h3>
                      <p className="text-lg text-gray-700 mb-2">
                        No pudiste responder a tiempo esta pregunta.
                      </p>
                      <p className="text-lg text-gray-700 mb-6">
                        {currentQuestionIndex < totalQuestions - 1 
                          ? "Siguiente pregunta en breve..."
                          : "El juego ha terminado."}
                      </p>
                    </div>
                  ) : selectedAnswer && selectedAnswer.toLowerCase().trim() === (currentQuestion?.field_correct_answer || "").toLowerCase().trim() ? (
                    <div className="bg-gradient-to-br from-[#e6fff2] to-white border-2 border-[#09d6a6] rounded-xl p-8 mb-4 shadow-lg">
                      <div className="text-6xl mb-3">🎉</div>
                      <h3 className="text-3xl font-bold text-[#09d6a6] mb-3">
                        ¡Correcto!
                      </h3>
                      <p className="text-lg text-gray-700 mb-2">
                        Tu respuesta: <strong className="text-[#09d6a6]">{selectedAnswer}</strong>
                      </p>
                      {lastEarnedPoints > 0 && (
                        <p className="text-lg text-[#09d6a6] font-semibold mb-2">
                          Ganaste {lastEarnedPoints}{" "}
                          {lastEarnedPoints === 1 ? "punto" : "puntos"} en esta pregunta.
                        </p>
                      )}
                      <p className="text-lg text-gray-700 mb-6">
                        {currentQuestionIndex < totalQuestions - 1 
                          ? "¡Siguiente pregunta en breve!"
                          : "¡Juego completado!"}
                      </p>
                    </div>
                  ) : selectedAnswer ? (
                    <div className="bg-red-50 border-2 border-red-400 rounded-xl p-8 mb-4 shadow-lg">
                      <div className="text-6xl mb-3">❌</div>
                      <h3 className="text-3xl font-bold text-red-700 mb-3">
                        Inténtalo de nuevo
                      </h3>
                      <p className="text-lg text-red-600 mb-2">
                        Tu respuesta: <strong>{selectedAnswer}</strong>
                      </p>
                      <p className="text-lg text-red-600 mb-6">
                        {currentQuestionIndex < totalQuestions - 1 
                          ? "Siguiente pregunta en breve..."
                          : "¡Inténtalo de nuevo!"}
                      </p>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Pista - Mejorado */}
              {gameDetails.field_hint && !isGameComplete && (
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
                        <strong className="text-[#09d6a6]">Pista:</strong> {gameDetails.field_hint}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Botón para volver - Solo si no hay respuesta */}
              {!isGameComplete && (
                <div className="text-center mt-8">
                  <button
                    onClick={onClose}
                    className="px-6 sm:px-8 py-3 bg-white text-gray-700 rounded-xl text-base sm:text-lg font-medium hover:bg-[#e4fef1] transition-all duration-200 border-2 border-gray-200 shadow-sm"
                  >
                    ← Volver a la Campaña
                  </button>
                </div>
              )}
            </>
          ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

