"use client";

import { useState, useEffect, useRef } from "react";
import { TrueFalseGameDetails, TrueFalseStatement } from "@/types/games";
import { updateRanking } from "@/services/games/update-ranking";
import { InfoIcon } from "lucide-react";

interface TrueFalseGameProps {
  gameDetails: TrueFalseGameDetails;
  onClose: () => void;
  campaignNid?: number;
}

export default function TrueFalseGame({
  gameDetails,
  onClose,
  campaignNid,
}: TrueFalseGameProps) {
  const [currentStatementIndex, setCurrentStatementIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<"true" | "false" | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [correctAnswers, setCorrectAnswers] = useState<number>(0);
  const [points, setPoints] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(gameDetails.field_time_limit || 0);
  const [isGameActive, setIsGameActive] = useState<boolean>(true);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [rankingUpdated, setRankingUpdated] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const statements = gameDetails.field_statements || [];
  const currentStatement: TrueFalseStatement | null = statements[currentStatementIndex] || null;
  const totalStatements = statements.length;
  const isGameComplete = currentStatementIndex >= totalStatements;

  useEffect(() => {
    if (gameDetails.field_time_limit && gameDetails.field_time_limit > 0 && timeLeft > 0 && isGameActive && !isGameComplete) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsGameActive(false);
            // Avanzar a la siguiente afirmación cuando se acaba el tiempo
            if (currentStatementIndex < totalStatements - 1) {
              setTimeout(() => {
                handleNextStatement();
              }, 1000);
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
  }, [gameDetails.field_time_limit, timeLeft, isGameActive, currentStatementIndex, totalStatements, isGameComplete]);

  const handleAnswerSelect = (answer: "true" | "false") => {
    if (isAnswered || !isGameActive || !currentStatement) return;

    setSelectedAnswer(answer);
    setIsAnswered(true);
    setIsGameActive(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const correctAnswer = currentStatement.field_correct_tf.toLowerCase().trim();
    const isCorrect = answer === correctAnswer;

    // Avanzar a la siguiente afirmación después de 2 segundos
    setTimeout(() => {
      const newCorrectAnswers = isCorrect ? correctAnswers + 1 : correctAnswers;
      
      if (isCorrect) {
        setCorrectAnswers((prev) => prev + 1);
      }

      if (currentStatementIndex < totalStatements - 1) {
        handleNextStatement();
      } else {
        // Juego completado
        const pointsPerStatement = gameDetails.field_points 
          ? Math.floor(gameDetails.field_points / totalStatements)
          : 0;
        const finalPoints = newCorrectAnswers * pointsPerStatement;
        setPoints(finalPoints);

        // Actualizar ranking si se completa el juego
        if (gameDetails.drupal_internal__id && !rankingUpdated) {
          setRankingUpdated(true);
          updateRanking(gameDetails.drupal_internal__id, finalPoints).catch((error) => {
            console.warn("No se pudo actualizar el ranking (esto no afecta tu puntuación):", error);
          });
        }
      }
    }, 2000);
  };

  const handleNextStatement = () => {
    setCurrentStatementIndex((prev) => prev + 1);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setShowHint(false);
    setIsGameActive(true);
    
    // Reiniciar el temporizador si hay tiempo límite por afirmación
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
    setCurrentStatementIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setCorrectAnswers(0);
    setPoints(0);
    setTimeLeft(gameDetails.field_time_limit || 0);
    setIsGameActive(true);
    setShowHint(false);
    setRankingUpdated(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  if (!currentStatement && !isGameComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="bg-white rounded-2xl border-2 border-red-400 shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl  text-red-700 mb-2">Error</h2>
          <p className="text-red-600 mb-6">No hay afirmaciones disponibles para este juego.</p>
          <button
            onClick={onClose}
            className="px-8 py-4 bg-gradient-to-r from-[#306393] to-blue-600 text-white rounded-full text-lg font-semibold shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
          >
            ← Volver a la Campaña
          </button>
        </div>
      </div>
    );
  }

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
                  ✔️
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl  text-gray-900">
                    {gameDetails.field_title}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">Verdadero o Falso</p>
                </div>
              </div>
              <div className="flex gap-3 sm:gap-4">
                
                <div className="flex items-center gap-2 bg-white rounded-xl border-2 px-4 py-2.5 shadow-sm">
                  <span className="text-lg">📊</span>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 leading-none">Progreso</span>
                    <span className="text-lg  text-gray-700 leading-none">
                      {currentStatementIndex + 1}/{totalStatements}
                    </span>
                  </div>
                </div>
                {isGameComplete && (
                  <div className="flex items-center gap-2 bg-gradient-to-br from-[#e6fff2] to-white rounded-xl border-2 border-[#09d6a6] px-4 py-2.5 shadow-sm">
                    <span className="text-lg">🌟</span>
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500 leading-none">Puntos</span>
                      <span className="text-lg  text-[#09d6a6] leading-none">
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
          {isGameComplete ? (
            // Resultado final
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-400 rounded-xl p-8 mb-6">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl  text-green-700 mb-4">
                  ¡Juego Completado!
                </h2>
                <div className="space-y-3 text-lg">
                  <p className="text-gray-700">
                    <strong>Respuestas correctas:</strong> {correctAnswers} de {totalStatements}
                  </p>
                  <p className="text-gray-700">
                    <strong>Porcentaje:</strong> {Math.round((correctAnswers / totalStatements) * 100)}%
                  </p>
                  {points > 0 && (
                    <p className="text-purple-600  text-xl mt-4">
                      Puntos obtenidos: {points}
                    </p>
                  )}
                  {gameDetails.field_badges?.name && (
                    <p className="text-[#09d6a6] font-bold text-xl mt-4">
                      🏆 Insignia obtenida: <span className="text-purple-600">{gameDetails.field_badges.name}</span>
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-4 justify-center mt-6">
                <button
                  onClick={handleRetry}
                  className="px-6 py-3 bg-gradient-to-r from-[#09d6a6] to-[#0bc9a0] text-white rounded-xl text-lg font-semibold shadow-lg hover:from-[#0bc9a0] hover:to-[#0dbc9a] transition-all duration-200 transform hover:scale-105"
                >
                  🔄 Jugar de Nuevo
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-500 text-white rounded-full text-lg font-semibold shadow-lg hover:bg-gray-600 transition-all duration-200"
                >
                  ← Volver a la Campaña
                </button>
              </div>
            </div>
          ) : currentStatement ? (
            <>
              {/* Afirmación actual */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-gradient-to-r from-[#09d6a6] to-[#0bc9a0] text-white px-4 py-2 rounded-lg  text-lg">
                    Afirmación {currentStatementIndex + 1}
                  </span>
                  {gameDetails.field_hint && (
                    <button
                      onClick={() => setShowHint(!showHint)}
                      className="px-3 py-1 bg-yellow-100 border border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors text-sm"
                    >
                      {showHint ? "Ocultar" : "Mostrar"} pista 💡
                    </button>
                  )}
                </div>
                
                <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 mb-8">
                  <h2 className="text-2xl md:text-3xl  text-gray-800 text-center">
                    {currentStatement.field_statement_text}
                  </h2>
                </div>

                {showHint && gameDetails.field_hint && (
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                    <p className="text-yellow-800">
                      <strong>Pista:</strong> {gameDetails.field_hint}
                    </p>
                  </div>
                )}

                {/* Opciones Verdadero/Falso */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <button
                    onClick={() => handleAnswerSelect("true")}
                    disabled={isAnswered || !isGameActive}
                    className={`
                      px-8 py-6 rounded-xl text-center transition-all duration-200 transform
                      ${isAnswered
                        ? selectedAnswer === "true" && currentStatement.field_correct_tf.toLowerCase().trim() === "true"
                          ? "bg-green-100 border-2 border-green-500 scale-105"
                          : selectedAnswer === "true" && currentStatement.field_correct_tf.toLowerCase().trim() !== "true"
                          ? "bg-red-100 border-2 border-red-500"
                          : "bg-gray-100 border-2 border-gray-300 cursor-not-allowed"
                        : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:scale-105 hover:shadow-lg cursor-pointer border-2 border-transparent"
                      }
                    `}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <span className="text-5xl">✅</span>
                      <span className="text-2xl ">VERDADERO</span>
                      {isAnswered && selectedAnswer === "true" && (
                        <span className="text-xl mt-2">
                          {currentStatement.field_correct_tf.toLowerCase().trim() === "true" ? "✓ Correcto" : "✗ Incorrecto"}
                        </span>
                      )}
                    </div>
                  </button>

                  <button
                    onClick={() => handleAnswerSelect("false")}
                    disabled={isAnswered || !isGameActive}
                    className={`
                      px-8 py-6 rounded-xl text-center transition-all duration-200 transform
                      ${isAnswered
                        ? selectedAnswer === "false" && currentStatement.field_correct_tf.toLowerCase().trim() === "false"
                          ? "bg-green-100 border-2 border-green-500 scale-105"
                          : selectedAnswer === "false" && currentStatement.field_correct_tf.toLowerCase().trim() !== "false"
                          ? "bg-red-100 border-2 border-red-500"
                          : "bg-gray-100 border-2 border-gray-300 cursor-not-allowed"
                        : "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 hover:scale-105 hover:shadow-lg cursor-pointer border-2 border-transparent"
                      }
                    `}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <span className="text-5xl">❌</span>
                      <span className="text-2xl ">FALSO</span>
                      {isAnswered && selectedAnswer === "false" && (
                        <span className="text-xl mt-2">
                          {currentStatement.field_correct_tf.toLowerCase().trim() === "false" ? "✓ Correcto" : "✗ Incorrecto"}
                        </span>
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {/* Indicador de progreso */}
              <div className="mt-8">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-[#09d6a6] to-[#0bc9a0] h-3 rounded-full transition-all duration-300"
                    style={{ width: `${((currentStatementIndex + 1) / totalStatements) * 100}%` }}
                  />
                </div>
                <p className="text-center text-gray-600 mt-2">
                  Progreso: {currentStatementIndex + 1} de {totalStatements} afirmaciones
                </p>
              </div>
            </>
          ) : null}

          {/* Botón para volver */}
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
          </div>
        </div>
      </div>
    </div>
  );
}

