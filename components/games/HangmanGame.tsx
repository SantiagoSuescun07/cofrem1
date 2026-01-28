"use client";

import { useState, useEffect, useRef } from "react";
import { HangmanGameDetails } from "@/types/games";
import { updateRanking } from "@/services/games/update-ranking";
import { InfoIcon } from "lucide-react";

interface HangmanGameProps {
  gameDetails: HangmanGameDetails;
  onClose: () => void;
  campaignNid?: number;
}

const MAX_ERRORS = 6;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// Función para normalizar letras (quitar acentos para comparación)
const normalizeLetter = (char: string): string => {
  return char
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
};

// Función para verificar si una letra está en la palabra (ignorando acentos)
const isLetterInWord = (letter: string, word: string): boolean => {
  const normalizedLetter = normalizeLetter(letter);
  return word.split("").some((char) => normalizeLetter(char) === normalizedLetter);
};

// Función para obtener todas las variantes de una letra en la palabra
const getLetterVariants = (letter: string, word: string): string[] => {
  const normalizedLetter = normalizeLetter(letter);
  return word
    .split("")
    .filter((char) => normalizeLetter(char) === normalizedLetter && /[A-ZÑÁÉÍÓÚÜ]/.test(char))
    .filter((char, index, arr) => arr.indexOf(char) === index); // Eliminar duplicados
};

export default function HangmanGame({
  gameDetails,
  onClose,
  campaignNid,
}: HangmanGameProps) {
  // Dividir field_words_phrases por líneas (enter o \r)
  const rounds = gameDetails.field_words_phrases
    .split(/\r?\n/)
    .map((line) => line.trim().toUpperCase())
    .filter((line) => line.length > 0);
  
  const [currentRound, setCurrentRound] = useState<number>(0);
  const word = rounds[currentRound] || "";
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<number>(0);
  const [isGameWon, setIsGameWon] = useState<boolean>(false);
  const [isGameLost, setIsGameLost] = useState<boolean>(false);
  const [points, setPoints] = useState<number>(0);
  // Cronómetro siempre de 60 segundos por ronda
  const INITIAL_TIME = 60;
  const [timeLeft, setTimeLeft] = useState<number>(INITIAL_TIME);
  const [isGameActive, setIsGameActive] = useState<boolean>(true);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [rankingUpdated, setRankingUpdated] = useState<boolean>(false);
  const [completedRounds, setCompletedRounds] = useState<number>(0);
  const [showRoundComplete, setShowRoundComplete] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Verificar si todas las letras han sido adivinadas (comparando letras normalizadas)
  const allLettersGuessed = word
    .split("")
    .filter((char) => /[A-ZÑÁÉÍÓÚÜ]/.test(char))
    .every((char) => {
      const normalizedChar = normalizeLetter(char);
      return Array.from(guessedLetters).some((guessed) => normalizeLetter(guessed) === normalizedChar);
    });

  // Avanzar a la siguiente ronda cuando se complete la palabra actual
  useEffect(() => {
    if (allLettersGuessed && errors < MAX_ERRORS && word && !isGameWon && !isGameLost && !showRoundComplete) {
      const nextRound = currentRound + 1;
      
      if (nextRound >= rounds.length) {
        // Se completaron todas las rondas
        setIsGameWon(true);
        setIsGameActive(false);
        setPoints(gameDetails.field_points || 0);

        // Actualizar ranking si el juego se completa correctamente
        if (gameDetails.drupal_internal__id && !rankingUpdated) {
          setRankingUpdated(true);
          const finalPoints = gameDetails.field_points || 0;
          updateRanking(gameDetails.drupal_internal__id, finalPoints).catch((error) => {
            console.warn("No se pudo actualizar el ranking (esto no afecta tu puntuación):", error);
          });
        }

        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      } else {
        // Mostrar mensaje de ronda completada
        setShowRoundComplete(true);
        setIsGameActive(false);
        setCompletedRounds((prev) => prev + 1);
        
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        
        // Avanzar a la siguiente ronda después de 2 segundos
        setTimeout(() => {
          setCurrentRound(nextRound);
          setGuessedLetters(new Set());
          setErrors(0);
          setTimeLeft(INITIAL_TIME);
          setShowRoundComplete(false);
          setIsGameActive(true);
        }, 2000);
      }
    }
  }, [allLettersGuessed, errors, isGameWon, isGameLost, word, currentRound, rounds.length, gameDetails.field_points, campaignNid, rankingUpdated, showRoundComplete]);

  // Verificar si el juego se perdió
  useEffect(() => {
    if (errors >= MAX_ERRORS && !isGameLost && !isGameWon) {
      setIsGameLost(true);
      setIsGameActive(false);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [errors, isGameLost, isGameWon]);

  // Reiniciar el cronómetro cuando cambia la ronda
  useEffect(() => {
    setTimeLeft(INITIAL_TIME);
  }, [currentRound]);

  // Cronómetro siempre activo de 60 segundos por ronda
  useEffect(() => {
    if (timeLeft > 0 && isGameActive && !isGameWon && !isGameLost) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsGameActive(false);
            setIsGameLost(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timeLeft, isGameActive, isGameWon, isGameLost]);

  const handleLetterClick = (letter: string) => {
    if (!isGameActive || guessedLetters.has(letter) || isGameWon || isGameLost) {
      return;
    }

    const newGuessedLetters = new Set(guessedLetters);
    newGuessedLetters.add(letter);
    
    // Agregar todas las variantes de la letra (con acentos) si están en la palabra
    const variants = getLetterVariants(letter, word);
    variants.forEach((variant) => newGuessedLetters.add(variant));
    
    setGuessedLetters(newGuessedLetters);

    // Si la letra no está en la palabra (comparando normalizada), incrementar errores
    if (!isLetterInWord(letter, word)) {
      setErrors((prev) => prev + 1);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Función para reiniciar el juego
  const handleRetry = () => {
    setCurrentRound(0);
    setGuessedLetters(new Set());
    setErrors(0);
    setIsGameWon(false);
    setIsGameLost(false);
    setPoints(0);
    setTimeLeft(INITIAL_TIME);
    setIsGameActive(true);
    setShowHint(false);
    setRankingUpdated(false);
    setCompletedRounds(0);
    setShowRoundComplete(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  // Renderizar la palabra con espacios y letras adivinadas
  const renderWord = () => {
    // Dividir la palabra en palabras separadas por espacios
    const words = word.split(" ");
    
    return words.map((wordPart, wordIndex) => {
      const letters = wordPart.split("").map((char, charIndex) => {
        if (!/[A-ZÑÁÉÍÓÚÜ]/.test(char)) {
          return (
            <span key={`${wordIndex}-${charIndex}`} className="text-xl  text-gray-800 mx-0.5">
              {char}
            </span>
          );
        } else {
          // Verificar si la letra (o su versión normalizada) ha sido adivinada
          const normalizedChar = normalizeLetter(char);
          const isGuessed = Array.from(guessedLetters).some(
            (guessed) => normalizeLetter(guessed) === normalizedChar
          );
          return (
            <span
              key={`${wordIndex}-${charIndex}`}
              className={`text-2xl sm:text-3xl  mx-0.5 min-w-[28px] sm:min-w-[32px] inline-flex items-center justify-center border-b-3 sm:border-b-4 leading-none ${
                isGuessed
                  ? "text-[#09d6a6] border-[#09d6a6]"
                  : "text-transparent border-gray-400"
              }`}
            >
              {isGuessed ? char : " "}
            </span>
          );
        }
      });

      return (
        <span key={wordIndex} className="inline-flex items-baseline mx-2">
          {letters}
        </span>
      );
    });
  };

  // Renderizar el dibujo del ahorcado
  const renderHangman = () => {
    const parts = [
      errors >= 1, // Cabeza
      errors >= 2, // Cuerpo
      errors >= 3, // Brazo izquierdo
      errors >= 4, // Brazo derecho
      errors >= 5, // Pierna izquierda
      errors >= 6, // Pierna derecha
    ];

    return (
      <div className="relative w-48 h-64 mx-auto mb-6">
        {/* Soporte */}
        <svg className="w-full h-full" viewBox="0 0 200 300">
          {/* Base */}
          <line x1="20" y1="280" x2="80" y2="280" stroke="#8B4513" strokeWidth="6" />
          {/* Poste vertical */}
          <line x1="50" y1="280" x2="50" y2="20" stroke="#8B4513" strokeWidth="6" />
          {/* Travesaño superior */}
          <line x1="50" y1="20" x2="150" y2="20" stroke="#8B4513" strokeWidth="6" />
          {/* Cuerda */}
          <line x1="150" y1="20" x2="150" y2="50" stroke="#654321" strokeWidth="4" />
          
          {/* Cabeza */}
          {parts[0] && (
            <circle cx="150" cy="70" r="20" stroke="#000" strokeWidth="3" fill="none" />
          )}
          
          {/* Cuerpo */}
          {parts[1] && (
            <line x1="150" y1="90" x2="150" y2="180" stroke="#000" strokeWidth="4" />
          )}
          
          {/* Brazo izquierdo */}
          {parts[2] && (
            <line x1="150" y1="120" x2="120" y2="150" stroke="#000" strokeWidth="4" />
          )}
          
          {/* Brazo derecho */}
          {parts[3] && (
            <line x1="150" y1="120" x2="180" y2="150" stroke="#000" strokeWidth="4" />
          )}
          
          {/* Pierna izquierda */}
          {parts[4] && (
            <line x1="150" y1="180" x2="120" y2="220" stroke="#000" strokeWidth="4" />
          )}
          
          {/* Pierna derecha */}
          {parts[5] && (
            <line x1="150" y1="180" x2="180" y2="220" stroke="#000" strokeWidth="4" />
          )}
        </svg>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full  py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {/* Card unificada con header e instrucciones */}
        <div className="mb-6">
          <div className="bg-white rounded-2xl shadow-lg border border-[#09d6a6]/20 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-[#09d6a6] to-[#0bc9a0] rounded-xl flex items-center justify-center text-2xl shadow-md flex-shrink-0">
                  ✏️
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl  text-gray-900">
                    {gameDetails.field_title}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">Ahorcado</p>
                </div>
              </div>
              <div className="flex gap-3 sm:gap-4">
                {rounds.length > 1 && (
                  <div className="flex items-center gap-2 bg-blue-50 rounded-xl border-2 border-blue-300 px-4 py-2.5 shadow-sm">
                    <span className="text-lg">🎯</span>
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500 leading-none">Ronda</span>
                      <span className="text-lg  text-blue-600 leading-none">
                        {currentRound + 1}/{rounds.length}
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-white rounded-xl border-2 px-4 py-2.5 shadow-sm">
                  <span className="text-lg">⏱️</span>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 leading-none">Tiempo</span>
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
                <div className="flex items-center gap-2 bg-gradient-to-br from-[#e6fff2] to-white rounded-xl border-2 border-[#09d6a6] px-4 py-2.5 shadow-sm">
                  <span className="text-lg">🌟</span>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 leading-none">Puntos</span>
                    <span className="text-lg  text-[#09d6a6] leading-none">
                      {points}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-red-50 rounded-xl border-2 border-red-300 px-4 py-2.5 shadow-sm">
                  <span className="text-lg">❌</span>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 leading-none">Errores</span>
                    <span className="text-lg  text-red-600 leading-none">
                      {errors}/{MAX_ERRORS}
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
          {/* Dibujo del ahorcado */}
          {renderHangman()}

          {/* Palabra a adivinar */}
          <div className="mb-8 text-center">
            <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-2 min-h-[60px] px-4">
              {renderWord()}
            </div>
          </div>

          {/* Mensaje de ronda completada */}
          {showRoundComplete && (
            <div className="text-center mb-6">
              <div className="bg-gradient-to-br from-[#e6fff2] to-white border-2 border-[#09d6a6] rounded-xl p-8 mb-4 shadow-lg">
                <div className="text-6xl mb-3">✅</div>
                <h3 className="text-3xl  text-[#09d6a6] mb-3">
                  ¡Ronda {currentRound + 1} Completada!
                </h3>
                <p className="text-gray-700 mb-2 text-lg">
                  Has adivinado: <strong className="text-[#09d6a6]">{word}</strong>
                </p>
                {rounds.length > currentRound + 1 && (
                  <p className="text-gray-600 mb-4 text-base">
                    Preparando ronda {currentRound + 2} de {rounds.length}...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Resultado del juego */}
          {isGameWon && (
            <div className="text-center mb-6">
              <div className="bg-gradient-to-br from-[#e6fff2] to-white border-2 border-[#09d6a6] rounded-xl p-8 mb-4 shadow-lg">
                <div className="text-6xl mb-3">🎉</div>
                <h3 className="text-3xl  text-[#09d6a6] mb-3">
                  ¡Felicidades!
                </h3>
                <p className="text-gray-700 mb-2 text-lg">
                  {rounds.length > 1 ? (
                    <>
                      Has completado todas las <strong className="text-[#09d6a6]">{rounds.length}</strong> rondas
                    </>
                  ) : (
                    <>
                      Has adivinado la palabra: <strong className="text-[#09d6a6]">{rounds[0]}</strong>
                    </>
                  )}
                </p>
                {rounds.length > 1 && (
                  <div className="mb-4 p-4 bg-[#e6fff2]/50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Palabras completadas:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {rounds.map((roundWord, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-[#09d6a6] text-white rounded-full text-sm font-semibold"
                        >
                          {roundWord}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-gray-700 mb-6 text-lg">
                  Has ganado <strong className="text-[#09d6a6] text-xl">{points}</strong> puntos
                </p>
                {gameDetails.field_badges?.name && (
                  <p className="text-[#09d6a6] font-bold text-xl mb-6">
                    🏆 Insignia obtenida: <span className="text-purple-600">{gameDetails.field_badges.name}</span>
                  </p>
                )}
                <div className="flex gap-4 justify-center">
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
            </div>
          )}

          {isGameLost && (
            <div className="text-center mb-6">
              <div className="bg-red-50 border-2 border-red-400 rounded-xl p-8 mb-4 shadow-lg">
                <div className="text-6xl mb-3">💀</div>
                <h3 className="text-3xl  text-red-700 mb-3">
                  ¡Game Over!
                </h3>
                <p className="text-red-600 mb-2 text-lg">
                  No lograste adivinar la palabra de la ronda {currentRound + 1}
                </p>
                {rounds.length > 1 && completedRounds > 0 && (
                  <p className="text-red-600 mb-2 text-base">
                    Completaste {completedRounds} de {rounds.length} rondas
                  </p>
                )}
                <p className="text-red-600 mb-6 text-lg">
                  Has alcanzado el máximo de errores
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
            </div>
          )}

          {/* Teclado de letras */}
          {!isGameWon && !isGameLost && !showRoundComplete && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-700 mb-4 text-center">
                Selecciona una letra:
              </h3>
              <div className="grid grid-cols-7 md:grid-cols-9 lg:grid-cols-9 gap-2 max-w-3xl mx-auto">
                {ALPHABET.map((letter) => {
                  const isGuessed = guessedLetters.has(letter);
                  const isCorrect = isLetterInWord(letter, word);
                  const isDisabled = isGuessed || !isGameActive;

                  return (
                    <button
                      key={letter}
                      onClick={() => handleLetterClick(letter)}
                      disabled={isDisabled}
                      className={`px-4 py-3 text-lg  rounded-lg transition-all duration-200 ${
                        isGuessed && isCorrect
                          ? "bg-green-500 text-white cursor-default"
                          : isGuessed && !isCorrect
                          ? "bg-red-500 text-white cursor-default"
                          : isDisabled
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-[#09d6a6] to-[#0bc9a0] text-white hover:from-[#0bc9a0] hover:to-[#0dbc9a] hover:scale-105 hover:shadow-lg"
                      }`}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pista */}
          {gameDetails.field_hint && !isGameWon && !isGameLost && !showRoundComplete && (
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

          {/* Botón para volver - Solo cuando el juego está activo */}
          {!isGameWon && !isGameLost && !showRoundComplete && (
            <div className="text-center">
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

