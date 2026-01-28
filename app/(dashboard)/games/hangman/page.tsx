"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useCampaigns, useGameDetails } from "@/queries/games";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import HangmanGame from "@/components/games/HangmanGame";
import GameLoader from "@/components/games/GameLoader";
import { HangmanGameDetails } from "@/types/games";

export default function HangmanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameId = searchParams?.get("id");
  
  const { data: campaigns, isLoading: campaignsLoading } = useCampaigns();
  const [gameUrl, setGameUrl] = useState<string | null>(null);

  const campaign = campaigns && campaigns.length > 0 ? campaigns[0] : null;

  useEffect(() => {
    if (campaign?.field_game_type && gameId) {
      const targetGame = campaign.field_game_type.find((game) => game.id === gameId);
      if (targetGame?.href) {
        setGameUrl(targetGame.href);
      }
    }
  }, [campaign, gameId]);

  const { data: gameDetails, isLoading: gameLoading } = useGameDetails(gameUrl);

  if (campaignsLoading || gameLoading) {
    return <GameLoader message="Cargando Ahorcado..." />;
  }

  if (!campaign || !gameDetails || gameDetails.type !== "paragraph--hangman_game") {
    return (
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-6">
        <div className="text-center py-12">
          <p className="text-red-500">Juego no encontrado</p>
          <Button
            onClick={() => router.push("/games")}
            className="mt-4 bg-[#306393] hover:bg-[#306393]/90"
          >
            Volver a la Campaña
          </Button>
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
            <BreadcrumbPage>{gameDetails.field_title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <HangmanGame
        gameDetails={gameDetails as HangmanGameDetails}
        onClose={() => router.push("/games")}
        campaignNid={campaign.drupal_internal__nid}
      />
    </div>
  );
}
