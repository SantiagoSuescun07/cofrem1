"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useCampaigns, useGameDetails } from "@/queries/games";
import WordSearchGame from "@/components/games/WordSearchGame";
import GameLoader from "@/components/games/GameLoader";
import { GameConfig } from "@/types/games";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

function parseDirections(
  directions: string[]
): {
  horizontal: boolean;
  vertical: boolean;
  diagonal: boolean;
  reverse: boolean;
} {
  return {
    horizontal: directions.includes("horizontal"),
    vertical: directions.includes("vertical"),
    diagonal: directions.includes("diagonal"),
    reverse: directions.includes("orden inverso"),
  };
}

function parseGridSize(gridSize: string): 10 | 15 | 20 {
  const size = parseInt(gridSize.split("x")[0]);
  if (size === 10) return 10;
  if (size === 15) return 15;
  if (size === 20) return 20;
  return 15; // Default
}

function parseWords(wordsString: string): string[] {
  return wordsString
    .split(",")
    .map((word) => word.trim().toUpperCase())
    .filter((word) => word.length > 0);
}

function gameDetailsToConfig(
  campaignTitle: string,
  gameDetails: any
): GameConfig {
  const words = parseWords(gameDetails.field_words_to_find || "");
  const directions = parseDirections(
    gameDetails.field_word_directions || []
  );
  const gridSize = parseGridSize(gameDetails.field_grid_size || "15x15");

  return {
    title: gameDetails.field_title || campaignTitle,
    description: gameDetails.field_description || "",
    words,
    pointsPerWord: gameDetails.field_points_per_word || 10,
    gridSize,
    directions,
    timeLimit: gameDetails.field_time_limit || 0,
    difficulty: "easy",
    gameId: gameDetails.drupal_internal__id,
  };
}

export default function WordSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameId = searchParams?.get("id");
  
  const { data: campaigns, isLoading: campaignsLoading } = useCampaigns();
  const [gameUrl, setGameUrl] = useState<string | null>(null);
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);

  // Obtener la primera campaña
  const campaign = campaigns && campaigns.length > 0 ? campaigns[0] : null;

  useEffect(() => {
    if (gameId) {
      // Si hay un ID en los parámetros, construir directamente la URL del juego
      // Esto funciona tanto para juegos desde campañas como desde publicaciones
      const gameUrl = `/jsonapi/paragraph/wordsearch_game/${gameId}`;
      setGameUrl(gameUrl);
    } else if (campaign?.field_game_type) {
      // Si no hay ID pero hay campaña, buscar el primer juego de tipo wordsearch
      const targetGame = campaign.field_game_type.find(
        (game) => game.type === "paragraph--wordsearch_game"
      );
      
      if (targetGame?.href) {
        setGameUrl(targetGame.href);
      }
    }
  }, [campaign, gameId]);

  const { data: gameDetails, isLoading: gameLoading } = useGameDetails(gameUrl);

  useEffect(() => {
    if (gameDetails) {
      // Usar el título de la campaña si existe, sino usar el título del juego o un título por defecto
      const title = campaign?.title || gameDetails.field_title || "Sopa de Letras";
      const config = gameDetailsToConfig(title, gameDetails);
      setGameConfig(config);
    }
  }, [campaign, gameDetails]);

  if (campaignsLoading || gameLoading || !gameConfig) {
    return <GameLoader message="Cargando Sopa de Letras..." />;
  }

  if (!gameDetails) {
    return (
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-6">
        <div className="text-center py-12">
          <p className="text-red-500">Juego no encontrado</p>
          <button
            onClick={() => router.push("/games")}
            className="mt-4 px-4 py-2 bg-[#306393] text-white rounded-lg hover:bg-[#306393]/90"
          >
            Volver a Juegos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 py-6">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Inicio</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/games">Gamificación</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Sopa de Letras</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <WordSearchGame
        config={gameConfig}
        onClose={() => router.push("/games")}
        campaignNid={campaign?.drupal_internal__nid}
      />
    </div>
  );
}

