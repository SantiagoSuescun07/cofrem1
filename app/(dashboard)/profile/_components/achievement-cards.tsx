"use client"

import { ProgressBar } from "@/components/common/progress-bar";
import { Card, CardContent } from "@/components/ui/card";
import { useUserProfile } from "@/queries/profile";
import Image from "next/image";
import { useUserId } from "./profile-header";

export function AchievementCards() {
  const achievements = [
    {
      icon: "/icons/blue-welcome.png",
      title: "Bienvenida",
      description: "Completaste tu registro exitosamente",
      color: "bg-[#d2eeff]",
      bgColor: "bg-white",
    },
    {
      icon: "/icons/perfil-icon.png",
      title: "Perfil",
      description: "Configuraste tu perfil completo",
      color: "bg-[#d4ffe8]",
      bgColor: "bg-white",
    },
    {
      icon: "/icons/start-icon.png",
      title: "Usuario Estrella",
      description: "Alcanzaste 500+ puntos de experiencia",
      color: "bg-[#d5fef6]",
      bgColor: "bg-white",
    },
  ];

  const userId = useUserId()
  const { data: profile, isLoading } = useUserProfile(userId!)

  console.log(profile)

  return (
    <div className="mt-20">
      <h2 className="text-xl mb-6 flex items-center gap-2">
        <Image
          src="/icons/blue-insigneas.png"
          alt="Insignias icon"
          width={40}
          height={40}
          priority
          className="size-[23px] mr-2"
        />
        Mis insignias
        <ProgressBar />
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {profile?.badges.map((badge, index) => {
          const hasImage = badge.image && badge.image.trim() !== "";
          
          return (
            <Card
              key={index}
              className={`border border-muted hover:scale-105 transition-transform duration-200 cursor-pointer`}
            >
              <CardContent className="p-6 text-center">
                <div
                  className={`inline-flex p-4 rounded-xl mb-4`}
                >
                  {hasImage ? (
                    <Image
                      src={badge.image!}
                      alt={badge.name || "Insignia"}
                      width={40}
                      height={40}
                      priority
                      className="size-[40px] object-cover"
                      onError={(e) => {
                        console.error(`[Badge] Error cargando imagen para ${badge.name}:`, badge.image);
                      }}
                    />
                  ) : (
                    <div className="size-[40px] bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-gray-400 text-xs">?</span>
                    </div>
                  )}
                </div>
                <h3 className="text-2xl mb-2">{badge.name}</h3>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
