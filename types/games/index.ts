export interface EntertainmentCampaign {
  id: string;
  drupal_internal__nid: number;
  title: string;
  body: string;
  created: string;
  changed: string;
  field_date_range: {
    value: string;
    end_value: string;
  };
  field_main_image: {
    id: string;
    url: string;
    alt: string;
    title: string;
    width: number;
    height: number;
  } | null;
  field_game_type: Array<{
    type: string;
    id: string;
    href: string;
  }>;
  field_badges: {
    id: string;
    name: string;
  } | null;
}

// Base interface con campos comunes a todos los juegos
export interface BaseGameDetails {
  id: string;
  drupal_internal__id: number;
  type: string;
  field_title: string;
  field_description: string | null;
  field_time_limit: number | null;
  field_points: number | null;
  field_icon: {
    id: string;
    url: string;
    alt: string;
    title: string;
    width: number;
    height: number;
  } | null;
  field_badges: {
    id: string;
    name: string;
  } | null;
}

// Juego: Sopa de letras
export interface WordSearchGameDetails extends BaseGameDetails {
  type: "paragraph--wordsearch_game";
  field_grid_size: string;
  field_points_per_word: number;
  field_word_directions: string[];
  field_words_to_find: string;
}

// Juego: Completar frase
export interface CompletePhraseGameDetails extends BaseGameDetails {
  type: "paragraph--complete_phrase_game";
  field_phrase_to_complete: string;
  field_correct_answer: string;
  field_incorrect_answer_1: string;
  field_incorrect_answer_2: string;
  field_hint: string;
}

// Juego: Descubrir emoji
export interface EmojiDiscoveryGameDetails extends BaseGameDetails {
  type: "paragraph--emoji_discovery_game";
  field_emoji_difficulty: string;
  field_hint: string;
  field_emojis?: Array<{
    id: string;
    type: string;
    field_emoji?: string;
    field_correct_answer?: string;
    field_incorrect_1?: string;
    field_incorrect_2?: string;
    field_incorrect_3?: string;
    field_incorrect_4?: string;
    field_question_phrase?: string;
  }>;
}

// Juego: Ahorcado
export interface HangmanGameDetails extends BaseGameDetails {
  type: "paragraph--hangman_game";
  field_words_phrases: string;
  field_hint: string;
}

// Juego: Memoria
export interface MemoryGameDetails extends BaseGameDetails {
  type: "paragraph--memory_game";
  field_memory_difficulty: string;
  field_puzzle_image?: Array<{
    id: string;
    url: string;
    alt: string;
    title: string;
    width: number;
    height: number;
  }>;
}

// Juego: Quiz
export interface QuizQuestion {
  id: string;
  field_question_text: string;
  field_option_1: string;
  field_option_2: string;
  field_option_3: string;
  field_option_4: string;
  field_correct_option: string; // "1", "2", "3", o "4"
  field_question_number: number;
  field_hint?: string;
}

export interface QuizGameDetails extends BaseGameDetails {
  type: "paragraph--quiz_game";
  field_quiz_questions?: QuizQuestion[];
}

// Juego: Trivia
export interface TriviaQuestion {
  id: string;
  field_question_text: string;
  field_correct_answer: string;
  field_incorrect_answer_1: string;
  field_incorrect_answer_2: string;
  field_incorrect_answer_3: string;
}

export interface TriviaGameDetails extends BaseGameDetails {
  type: "paragraph--trivia_game";
  field_questions?: TriviaQuestion[];
}

// Juego: Verdadero o Falso
export interface TrueFalseStatement {
  id: string;
  field_statement_text: string;
  field_correct_tf: string; // "true" o "false"
}

export interface TrueFalseGameDetails extends BaseGameDetails {
  type: "paragraph--true_false_game";
  field_hint: string;
  field_statements?: TrueFalseStatement[];
}

// Juego: Emparejar palabras
export interface WordMatchPair {
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
}

export interface WordMatchGameDetails extends BaseGameDetails {
  type: "paragraph--word_match_game";
  field_word_match_difficulty: string;
  field_pairs?: WordMatchPair[];
}

// Juego: Rompecabezas
export interface PuzzleGameDetails extends BaseGameDetails {
  type: "paragraph--puzzle_game";
  field_puzzle_difficulty: string;
  field_puzzle_image?: Array<{
    id: string;
    url: string;
    alt: string;
    title: string;
    width: number;
    height: number;
  }>;
}

// Union type para todos los tipos de juegos
export type GameDetails =
  | WordSearchGameDetails
  | CompletePhraseGameDetails
  | EmojiDiscoveryGameDetails
  | HangmanGameDetails
  | MemoryGameDetails
  | QuizGameDetails
  | TriviaGameDetails
  | TrueFalseGameDetails
  | WordMatchGameDetails
  | PuzzleGameDetails;

export type GameType = "wordsearch_game" | "puzzle_game" | "trivia_game";

export interface GameConfig {
  title: string;
  description: string;
  words: string[];
  pointsPerWord: number;
  gridSize: 10 | 15 | 20;
  directions: {
    horizontal: boolean;
    vertical: boolean;
    diagonal: boolean;
    reverse: boolean;
  };
  timeLimit: number;
  difficulty: "easy" | "medium" | "hard";
  gameId?: number;
}

export interface RankingEntry {
  position: number;
  user: string;
  area: string | null;
  points: string;
  games_completed: string;
  is_current_user: boolean;
}

export interface RankingResponse {
  campaign: string;
  period: string;
  visibility: string;
  tiebreaker: string;
  ranking: RankingEntry[];
}

