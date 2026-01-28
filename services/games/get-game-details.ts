import { apiBaseUrl } from "@/constants";
import api from "@/lib/axios";
import { GameDetails } from "@/types/games";
import { normalizeImageUrl } from "@/lib/image-url-normalizer";

export const fetchGameDetails = async (
  gameUrl: string
): Promise<GameDetails | null> => {
  try {
    // La URL puede ser relativa o absoluta
    let url = gameUrl;
    if (gameUrl.startsWith("http")) {
   
      try {
        const urlObj = new URL(gameUrl);
        url = urlObj.pathname + urlObj.search;
      } catch {

        url = gameUrl.replace(apiBaseUrl, "");
      }
    }

    // Incluir todos los campos relacionados posibles para diferentes tipos de juegos
    // Intentamos incluir todos los campos comunes que pueden existir
    // Nota: field_puzzle_image existe para memory_game y puzzle_game
    // field_emojis existe para emoji_discovery_game
    // field_badges existe para todos los juegos
    let includeParams = "field_icon,field_badges";
    if (url.includes('memory_game') || url.includes('puzzle_game')) {
      includeParams = "field_icon,field_badges,field_puzzle_image";
    } else if (url.includes('emoji_discovery_game')) {
      includeParams = "field_icon,field_badges,field_emojis";
    }
    
    const response = await api.get(url, {
      params: {
        include: includeParams,
      },
    });

    const data = response.data;

    // Log de la respuesta completa para debugging
    console.log(`[Game Details] URL completa: ${url}`);
    console.log(`[Game Details] Respuesta completa:`, JSON.stringify(data, null, 2));

    // Validar que la respuesta tiene la estructura esperada
    if (!data || !data.data) {
      console.error("Invalid response structure:", data);
      return null;
    }

    // Crear un mapa de recursos incluidos
    const includedById = new Map<string, any>();
    if (data.included) {
      data.included.forEach((included: any) => {
        includedById.set(included.id, included);
      });
    }

    // Resolver field_icon
    const iconData = data.data.relationships?.field_icon?.data;
    const iconIncluded = iconData ? includedById.get(iconData.id) : null;
    const fieldIcon = iconIncluded
      ? {
          id: iconIncluded.id,
          url: normalizeImageUrl(apiBaseUrl, iconIncluded.attributes.uri.url),
          alt: iconData.meta.alt || "",
          title: iconData.meta.title || "",
          width: iconData.meta.width || 0,
          height: iconData.meta.height || 0,
        }
      : null;

    // Resolver field_badges
    const badgesData = data.data.relationships?.field_badges?.data;
    const badgesIncluded = badgesData
      ? includedById.get(badgesData.id)
      : null;
    const fieldBadges = badgesIncluded
      ? {
          id: badgesIncluded.id,
          name: badgesIncluded.attributes.name || "",
        }
      : null;

    // Obtener todos los atributos disponibles
    const allAttributes = data.data.attributes;
    const allRelationships = data.data.relationships;
    const gameType = data.data.type;
    
    console.log(`[Game Details] Tipo de juego: ${gameType}`);
    console.log(`[Game Details] Todos los atributos:`, JSON.stringify(allAttributes, null, 2));
    console.log(`[Game Details] Todas las relaciones:`, JSON.stringify(allRelationships, null, 2));

    // Base común para todos los juegos
    const baseGame: any = {
      id: data.data.id,
      drupal_internal__id: allAttributes.drupal_internal__id || 0,
      type: gameType,
      field_title: allAttributes.field_title || "",
      field_description: allAttributes.field_description || null,
      field_time_limit: allAttributes.field_time_limit ?? null,
      field_points: allAttributes.field_points ?? allAttributes.field_points_per_word ?? null,
      field_icon: fieldIcon,
      field_badges: fieldBadges,
    };

    // Construir el objeto específico según el tipo de juego
    let gameDetails: GameDetails;

    switch (gameType) {
      case "paragraph--wordsearch_game":
        gameDetails = {
          ...baseGame,
          type: "paragraph--wordsearch_game",
          field_grid_size: allAttributes.field_grid_size || "15x15",
          field_points_per_word: allAttributes.field_points_per_word || 10,
          field_word_directions: allAttributes.field_word_directions || [],
          field_words_to_find: allAttributes.field_words_to_find || "",
        } as GameDetails;
        break;

      case "paragraph--complete_phrase_game":
        gameDetails = {
          ...baseGame,
          type: "paragraph--complete_phrase_game",
          field_phrase_to_complete: allAttributes.field_phrase_to_complete || "",
          field_correct_answer: allAttributes.field_correct_answer || "",
          field_incorrect_answer_1: allAttributes.field_incorrect_answer_1 || "",
          field_incorrect_answer_2: allAttributes.field_incorrect_answer_2 || "",
          field_hint: allAttributes.field_hint || "",
        } as GameDetails;
        break;

      case "paragraph--emoji_discovery_game":
        // Obtener los datos completos de los emoji items
        let fieldEmojiItems: Array<{
          id: string;
          type: string;
          field_emoji?: string;
          field_correct_answer?: string;
          field_incorrect_1?: string;
          field_incorrect_2?: string;
          field_incorrect_3?: string;
          field_incorrect_4?: string;
          field_question_phrase?: string;
        }> = [];
        
        const emojiItemsData = allRelationships.field_emojis?.data || [];
        
        // Intentar obtener de included primero
        const emojiItemsFromIncluded = emojiItemsData.map((emojiItem: any) => {
          const emojiIncluded = includedById.get(emojiItem.id);
          if (emojiIncluded && emojiIncluded.attributes) {
            return {
              id: emojiIncluded.id,
              type: emojiIncluded.type,
              field_emoji: emojiIncluded.attributes.field_emoji || "",
              field_correct_answer: emojiIncluded.attributes.field_correct_answer || "",
              field_incorrect_1: emojiIncluded.attributes.field_incorrect_1 || "",
              field_incorrect_2: emojiIncluded.attributes.field_incorrect_2 || "",
              field_incorrect_3: emojiIncluded.attributes.field_incorrect_3 || "",
              field_incorrect_4: emojiIncluded.attributes.field_incorrect_4 || "",
              field_question_phrase: emojiIncluded.attributes.field_question_phrase || "",
            };
          }
          return null;
        }).filter((e: any) => e !== null);
        
        // Si obtuvimos todos los emojis de included, usarlos
        if (emojiItemsFromIncluded.length === emojiItemsData.length && emojiItemsFromIncluded.length > 0) {
          fieldEmojiItems = emojiItemsFromIncluded;
        } else if (emojiItemsData.length > 0 && allRelationships.field_emojis?.links?.related) {
          // Si no están todos en included, obtener del endpoint relacionado
          try {
            const relatedUrl = allRelationships.field_emojis.links.related.href;
            const relatedResponse = await api.get(relatedUrl);
            const relatedData = relatedResponse.data;
            
            if (relatedData.data && Array.isArray(relatedData.data)) {
              fieldEmojiItems = relatedData.data.map((emojiItem: any) => ({
                id: emojiItem.id,
                type: emojiItem.type,
                field_emoji: emojiItem.attributes.field_emoji || "",
                field_correct_answer: emojiItem.attributes.field_correct_answer || "",
                field_incorrect_1: emojiItem.attributes.field_incorrect_1 || "",
                field_incorrect_2: emojiItem.attributes.field_incorrect_2 || "",
                field_incorrect_3: emojiItem.attributes.field_incorrect_3 || "",
                field_incorrect_4: emojiItem.attributes.field_incorrect_4 || "",
                field_question_phrase: emojiItem.attributes.field_question_phrase || "",
              }));
            }
          } catch (error) {
            console.warn("[Game Details] Error al obtener field_emojis del endpoint relacionado:", error);
            // Si falla, usar los que obtuvimos de included (si hay alguno)
            fieldEmojiItems = emojiItemsFromIncluded;
          }
        } else {
          // Si no hay endpoint relacionado, usar los que obtuvimos de included
          fieldEmojiItems = emojiItemsFromIncluded;
        }
        
        gameDetails = {
          ...baseGame,
          type: "paragraph--emoji_discovery_game",
          field_emoji_difficulty: allAttributes.field_emoji_difficulty || "",
          field_hint: allAttributes.field_hint || "",
          field_emojis: fieldEmojiItems,
        } as GameDetails;
        break;

      case "paragraph--hangman_game":
        gameDetails = {
          ...baseGame,
          type: "paragraph--hangman_game",
          field_words_phrases: allAttributes.field_words_phrases || "",
          field_hint: allAttributes.field_hint || "",
        } as GameDetails;
        break;

      case "paragraph--memory_game":
        // Resolver field_puzzle_image
        // Las imágenes pueden no estar en included, así que necesitamos obtenerlas del endpoint relacionado
        let fieldPuzzleImage: Array<{
          id: string;
          url: string;
          alt: string;
          title: string;
          width: number;
          height: number;
        }> = [];
        
        const puzzleImageData = allRelationships.field_puzzle_image?.data || [];
        
        // Primero intentar obtener de included
        const imagesFromIncluded = puzzleImageData.map((imgData: any) => {
          const imgIncluded = includedById.get(imgData.id);
          if (imgIncluded && imgIncluded.attributes?.uri?.url) {
            return {
              id: imgIncluded.id,
              url: normalizeImageUrl(apiBaseUrl, imgIncluded.attributes.uri.url),
              alt: imgData.meta?.alt || "",
              title: imgData.meta?.title || "",
              width: imgData.meta?.width || imgIncluded.attributes?.width || 0,
              height: imgData.meta?.height || imgIncluded.attributes?.height || 0,
            };
          }
          return null;
        }).filter((img: any) => img !== null);
        
        // Si obtuvimos imágenes de included, usarlas
        if (imagesFromIncluded.length > 0) {
          fieldPuzzleImage = imagesFromIncluded;
        } else if (puzzleImageData.length > 0 && allRelationships.field_puzzle_image?.links?.related) {
          // Si no están en included, intentar obtener del endpoint relacionado
          try {
            const relatedUrl = allRelationships.field_puzzle_image.links.related.href;
            const relatedResponse = await api.get(relatedUrl);
            const relatedData = relatedResponse.data;
            
            if (relatedData.data && Array.isArray(relatedData.data)) {
              fieldPuzzleImage = relatedData.data.map((fileItem: any, index: number) => {
                const originalMeta = puzzleImageData[index]?.meta || {};
                return {
                  id: fileItem.id,
                  url: normalizeImageUrl(apiBaseUrl, fileItem.attributes.uri.url),
                  alt: originalMeta.alt || "",
                  title: originalMeta.title || "",
                  width: originalMeta.width || 0,
                  height: originalMeta.height || 0,
                };
              });
            }
          } catch (error) {
            console.warn("[Game Details] Error al obtener field_puzzle_image del endpoint relacionado:", error);
            // Si falla, usar los datos que tenemos en meta
            fieldPuzzleImage = puzzleImageData.map((imgData: any) => {
              // Construir URL usando el drupal_internal__target_id si está disponible
              const fid = imgData.meta?.drupal_internal__target_id;
              if (fid) {
                // Intentar construir una URL basada en el patrón común de Drupal
                // Esto es un fallback, pero debería funcionar en la mayoría de casos
                return {
                  id: imgData.id,
                  url: normalizeImageUrl(apiBaseUrl, `/sites/default/files/${fid}`),
                  alt: imgData.meta?.alt || "",
                  title: imgData.meta?.title || "",
                  width: imgData.meta?.width || 0,
                  height: imgData.meta?.height || 0,
                };
              }
              return null;
            }).filter((img: any) => img !== null);
          }
        }

        gameDetails = {
          ...baseGame,
          type: "paragraph--memory_game",
          field_memory_difficulty: allAttributes.field_memory_difficulty || "",
          field_puzzle_image: fieldPuzzleImage,
        } as GameDetails;
        break;

      case "paragraph--quiz_game":
        // Obtener las preguntas del quiz desde el endpoint relacionado
        let fieldQuizQuestions: Array<{
          id: string;
          field_question_text: string;
          field_option_1: string;
          field_option_2: string;
          field_option_3: string;
          field_option_4: string;
          field_correct_option: string;
          field_question_number: number;
          field_hint?: string;
        }> = [];
        
        const quizQuestionsData = allRelationships.field_quiz_questions?.data || [];
        
        // Intentar obtener de included primero
        const questionsFromIncluded = quizQuestionsData.map((questionData: any) => {
          const questionIncluded = includedById.get(questionData.id);
          if (questionIncluded && questionIncluded.attributes) {
            return {
              id: questionIncluded.id,
              field_question_text: questionIncluded.attributes.field_question_text || "",
              field_option_1: questionIncluded.attributes.field_option_1 || "",
              field_option_2: questionIncluded.attributes.field_option_2 || "",
              field_option_3: questionIncluded.attributes.field_option_3 || "",
              field_option_4: questionIncluded.attributes.field_option_4 || "",
              field_correct_option: questionIncluded.attributes.field_correct_option || "1",
              field_question_number: questionIncluded.attributes.field_question_number || 0,
              field_hint: questionIncluded.attributes.field_hint || undefined,
            };
          }
          return null;
        }).filter((q: any) => q !== null);
        
        // Si obtuvimos preguntas de included, usarlas
        if (questionsFromIncluded.length > 0) {
          fieldQuizQuestions = questionsFromIncluded;
        } else if (quizQuestionsData.length > 0 && allRelationships.field_quiz_questions?.links?.related) {
          // Si no están en included, obtener del endpoint relacionado
          try {
            const relatedUrl = allRelationships.field_quiz_questions.links.related.href;
            const relatedResponse = await api.get(relatedUrl);
            const relatedData = relatedResponse.data;
            
            if (relatedData.data && Array.isArray(relatedData.data)) {
              fieldQuizQuestions = relatedData.data.map((questionItem: any) => ({
                id: questionItem.id,
                field_question_text: questionItem.attributes.field_question_text || "",
                field_option_1: questionItem.attributes.field_option_1 || "",
                field_option_2: questionItem.attributes.field_option_2 || "",
                field_option_3: questionItem.attributes.field_option_3 || "",
                field_option_4: questionItem.attributes.field_option_4 || "",
                field_correct_option: questionItem.attributes.field_correct_option || "1",
                field_question_number: questionItem.attributes.field_question_number || 0,
                field_hint: questionItem.attributes.field_hint || undefined,
              }));
            }
          } catch (error) {
            console.warn("[Game Details] Error al obtener field_quiz_questions del endpoint relacionado:", error);
          }
        }
        
        gameDetails = {
          ...baseGame,
          type: "paragraph--quiz_game",
          field_quiz_questions: fieldQuizQuestions,
        } as GameDetails;
        break;

      case "paragraph--trivia_game":
        // Obtener las preguntas de trivia desde el endpoint relacionado
        let fieldTriviaQuestions: Array<{
          id: string;
          field_question_text: string;
          field_correct_answer: string;
          field_incorrect_answer_1: string;
          field_incorrect_answer_2: string;
          field_incorrect_answer_3: string;
        }> = [];
        
        const triviaQuestionsData = allRelationships.field_questions?.data || [];
        
        // Intentar obtener de included primero
        const triviaQuestionsFromIncluded = triviaQuestionsData.map((questionData: any) => {
          const questionIncluded = includedById.get(questionData.id);
          if (questionIncluded && questionIncluded.attributes) {
            return {
              id: questionIncluded.id,
              field_question_text: questionIncluded.attributes.field_question_text || "",
              field_correct_answer: questionIncluded.attributes.field_correct_answer || "",
              field_incorrect_answer_1: questionIncluded.attributes.field_incorrect_answer_1 || "",
              field_incorrect_answer_2: questionIncluded.attributes.field_incorrect_answer_2 || "",
              field_incorrect_answer_3: questionIncluded.attributes.field_incorrect_answer_3 || "",
            };
          }
          return null;
        }).filter((q: any) => q !== null);
        
        // Si obtuvimos preguntas de included, usarlas
        if (triviaQuestionsFromIncluded.length > 0) {
          fieldTriviaQuestions = triviaQuestionsFromIncluded;
        } else if (triviaQuestionsData.length > 0 && allRelationships.field_questions?.links?.related) {
          // Si no están en included, obtener del endpoint relacionado
          try {
            const relatedUrl = allRelationships.field_questions.links.related.href;
            const relatedResponse = await api.get(relatedUrl);
            const relatedData = relatedResponse.data;
            
            if (relatedData.data && Array.isArray(relatedData.data)) {
              fieldTriviaQuestions = relatedData.data.map((questionItem: any) => ({
                id: questionItem.id,
                field_question_text: questionItem.attributes.field_question_text || "",
                field_correct_answer: questionItem.attributes.field_correct_answer || "",
                field_incorrect_answer_1: questionItem.attributes.field_incorrect_answer_1 || "",
                field_incorrect_answer_2: questionItem.attributes.field_incorrect_answer_2 || "",
                field_incorrect_answer_3: questionItem.attributes.field_incorrect_answer_3 || "",
              }));
            }
          } catch (error) {
            console.warn("[Game Details] Error al obtener field_questions del endpoint relacionado:", error);
          }
        }
        
        gameDetails = {
          ...baseGame,
          type: "paragraph--trivia_game",
          field_questions: fieldTriviaQuestions,
        } as GameDetails;
        break;

      case "paragraph--true_false_game":
        // Obtener los statements de verdadero/falso desde el endpoint relacionado
        let fieldTrueFalseStatements: Array<{
          id: string;
          field_statement_text: string;
          field_correct_tf: string;
        }> = [];
        
        const statementsData = allRelationships.field_statements?.data || [];
        
        // Intentar obtener de included primero
        const statementsFromIncluded = statementsData.map((statementData: any) => {
          const statementIncluded = includedById.get(statementData.id);
          if (statementIncluded && statementIncluded.attributes) {
            return {
              id: statementIncluded.id,
              field_statement_text: statementIncluded.attributes.field_statement_text || "",
              field_correct_tf: statementIncluded.attributes.field_correct_tf || "true",
            };
          }
          return null;
        }).filter((s: any) => s !== null);
        
        // Si obtuvimos statements de included, usarlos
        if (statementsFromIncluded.length > 0) {
          fieldTrueFalseStatements = statementsFromIncluded;
        } else if (statementsData.length > 0 && allRelationships.field_statements?.links?.related) {
          // Si no están en included, obtener del endpoint relacionado
          try {
            const relatedUrl = allRelationships.field_statements.links.related.href;
            const relatedResponse = await api.get(relatedUrl);
            const relatedData = relatedResponse.data;
            
            if (relatedData.data && Array.isArray(relatedData.data)) {
              fieldTrueFalseStatements = relatedData.data.map((statementItem: any) => ({
                id: statementItem.id,
                field_statement_text: statementItem.attributes.field_statement_text || "",
                field_correct_tf: statementItem.attributes.field_correct_tf || "true",
              }));
            }
          } catch (error) {
            console.warn("[Game Details] Error al obtener field_statements del endpoint relacionado:", error);
          }
        }
        
        gameDetails = {
          ...baseGame,
          type: "paragraph--true_false_game",
          field_hint: allAttributes.field_hint || "",
          field_statements: fieldTrueFalseStatements,
        } as GameDetails;
        break;

      case "paragraph--word_match_game":
        // Obtener los pares de palabras desde el endpoint relacionado
        let fieldWordMatchPairs: Array<{
          id: string;
          field_associated_text: string;
          field_puzzle_image?: Array<{
            id: string;
            url: string;
            alt: string;
            title: string;
            width: number;
            height: number;
          }>;
        }> = [];
        
        const pairsData = allRelationships.field_pairs?.data || [];
        
        // Intentar obtener de included primero
        const pairsFromIncluded = pairsData.map((pairData: any) => {
          const pairIncluded = includedById.get(pairData.id);
          if (pairIncluded && pairIncluded.attributes) {
            // Obtener las imágenes del par
            const puzzleImageData = pairIncluded.relationships?.field_puzzle_image?.data || [];
            const puzzleImages = puzzleImageData.map((imgData: any) => {
              const imgIncluded = includedById.get(imgData.id);
              if (imgIncluded && imgIncluded.attributes?.uri?.url) {
                return {
                  id: imgIncluded.id,
                  url: normalizeImageUrl(apiBaseUrl, imgIncluded.attributes.uri.url),
                  alt: imgData.meta?.alt || "",
                  title: imgData.meta?.title || "",
                  width: imgData.meta?.width || 0,
                  height: imgData.meta?.height || 0,
                };
              }
              return null;
            }).filter((img: any) => img !== null);
            
            return {
              id: pairIncluded.id,
              field_associated_text: pairIncluded.attributes.field_associated_text || "",
              field_puzzle_image: puzzleImages.length > 0 ? puzzleImages : undefined,
            };
          }
          return null;
        }).filter((p: any) => p !== null);
        
        // Si obtuvimos pares de included, usarlos
        if (pairsFromIncluded.length > 0) {
          fieldWordMatchPairs = pairsFromIncluded;
        } else if (pairsData.length > 0 && allRelationships.field_pairs?.links?.related) {
          // Si no están en included, obtener del endpoint relacionado
          try {
            const relatedUrl = allRelationships.field_pairs.links.related.href;
            const relatedResponse = await api.get(relatedUrl);
            const relatedData = relatedResponse.data;
            
            // Crear mapa de recursos incluidos del endpoint relacionado
            const relatedIncludedById = new Map<string, any>();
            if (relatedData.included) {
              relatedData.included.forEach((included: any) => {
                relatedIncludedById.set(included.id, included);
              });
            }
            
            if (relatedData.data && Array.isArray(relatedData.data)) {
              // Procesar cada par y obtener sus imágenes
              const pairsWithImages = await Promise.all(
                relatedData.data.map(async (pairItem: any) => {
                  let puzzleImages: Array<{
                    id: string;
                    url: string;
                    alt: string;
                    title: string;
                    width: number;
                    height: number;
                  }> = [];

                  // Intentar obtener las imágenes del included primero
                  const puzzleImageData = pairItem.relationships?.field_puzzle_image?.data || [];
                  const imagesFromIncluded = puzzleImageData.map((imgData: any) => {
                    const imgIncluded = relatedIncludedById.get(imgData.id);
                    if (imgIncluded && imgIncluded.attributes?.uri?.url) {
                      return {
                        id: imgIncluded.id,
                        url: normalizeImageUrl(apiBaseUrl, imgIncluded.attributes.uri.url),
                        alt: imgData.meta?.alt || "",
                        title: imgData.meta?.title || "",
                        width: imgData.meta?.width || 0,
                        height: imgData.meta?.height || 0,
                      };
                    }
                    return null;
                  }).filter((img: any) => img !== null);

                  if (imagesFromIncluded.length > 0) {
                    puzzleImages = imagesFromIncluded;
                  } else if (puzzleImageData.length > 0 && pairItem.relationships?.field_puzzle_image?.links?.related) {
                    // Si no están en included, obtener del endpoint relacionado de imágenes
                    try {
                      const imageRelatedUrl = pairItem.relationships.field_puzzle_image.links.related.href;
                      const imageRelatedResponse = await api.get(imageRelatedUrl);
                      const imageRelatedData = imageRelatedResponse.data;

                      if (imageRelatedData.data && Array.isArray(imageRelatedData.data)) {
                        puzzleImages = imageRelatedData.data.map((fileItem: any) => {
                          const originalMeta = puzzleImageData.find((imgData: any) => imgData.id === fileItem.id)?.meta || {};
                          return {
                            id: fileItem.id,
                            url: normalizeImageUrl(apiBaseUrl, fileItem.attributes.uri.url),
                            alt: originalMeta.alt || "",
                            title: originalMeta.title || "",
                            width: originalMeta.width || 0,
                            height: originalMeta.height || 0,
                          };
                        });
                      }
                    } catch (error) {
                      console.warn(`[Game Details] Error al obtener imágenes para el par ${pairItem.id}:`, error);
                    }
                  }

                  return {
                    id: pairItem.id,
                    field_associated_text: pairItem.attributes.field_associated_text || "",
                    field_puzzle_image: puzzleImages.length > 0 ? puzzleImages : undefined,
                  };
                })
              );

              fieldWordMatchPairs = pairsWithImages;
            }
          } catch (error) {
            console.warn("[Game Details] Error al obtener field_pairs del endpoint relacionado:", error);
          }
        }
        
        gameDetails = {
          ...baseGame,
          type: "paragraph--word_match_game",
          field_word_match_difficulty: allAttributes.field_word_match_difficulty || "",
          field_pairs: fieldWordMatchPairs,
        } as GameDetails;
        break;

      case "paragraph--puzzle_game":
        // Obtener las imágenes del rompecabezas
        let fieldPuzzleGameImages: Array<{
          id: string;
          url: string;
          alt: string;
          title: string;
          width: number;
          height: number;
        }> = [];

        const puzzleGameImageData = allRelationships.field_puzzle_image?.data || [];
        if (puzzleGameImageData.length > 0) {
          fieldPuzzleGameImages = puzzleGameImageData.map((imgData: any) => {
            const imgIncluded = includedById.get(imgData.id);
            if (imgIncluded && imgIncluded.attributes?.uri?.url) {
              return {
                id: imgIncluded.id,
                url: normalizeImageUrl(apiBaseUrl, imgIncluded.attributes.uri.url),
                alt: imgData.meta?.alt || "",
                title: imgData.meta?.title || "",
                width: imgData.meta?.width || 0,
                height: imgData.meta?.height || 0,
              };
            }
            return null;
          }).filter((img: any) => img !== null);
        }

        gameDetails = {
          ...baseGame,
          type: "paragraph--puzzle_game",
          field_puzzle_difficulty: allAttributes.field_puzzle_difficulty || "",
          field_puzzle_image: fieldPuzzleGameImages.length > 0 ? fieldPuzzleGameImages : undefined,
        } as GameDetails;
        break;

      default:
        // Fallback para tipos desconocidos
        console.warn(`[Game Details] Tipo de juego desconocido: ${gameType}, usando campos base`);
        gameDetails = {
          ...baseGame,
          type: gameType as any,
        } as GameDetails;
    }

    return gameDetails;
  } catch (error) {
    console.error("Error fetching game details:", error);
    return null;
  }
};

