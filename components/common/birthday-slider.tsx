"use client";

import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useEffect, useState, useCallback } from "react";
import { useBirthdayQuery } from "@/queries/birthday";
import { User } from "lucide-react";
import Image from "next/image";
import { BirthdayModal } from "./birthday-modal";
import { Birthday } from "@/services/birthday/get-birthdays";
import { Skeleton } from "@/components/ui/skeleton";

export function BirthdaySlider() {
  const { data: birthdays = [], isLoading, error } = useBirthdayQuery();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay()]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedBirthday, setSelectedBirthday] = useState<Birthday | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Obtener fecha de hoy en formato MM-DD
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayStr = `${month}-${day}`;

  // Filtrar cumpleaños de hoy
  const todayBirthdays = birthdays.filter(b => {
    if (!b.field_birthdate) return false;
    
    // Manejar diferentes formatos de fecha
    let birthDateStr = '';
    try {
      // Si es formato ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss)
      if (b.field_birthdate.includes('-')) {
        birthDateStr = b.field_birthdate.slice(5, 10); // MM-DD
      } else {
        // Si es otro formato, intentar parsearlo
        const date = new Date(b.field_birthdate);
        if (!isNaN(date.getTime())) {
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          birthDateStr = `${month}-${day}`;
        }
      }
    } catch (e) {
      console.error('Error parsing birthdate:', b.field_birthdate, e);
      return false;
    }
    
    return birthDateStr === todayStr;
  });

  // dividir en grupos de 2
  const grouped = [];
  for (let i = 0; i < todayBirthdays.length; i += 2) {
    grouped.push(todayBirthdays.slice(i, i + 2));
  }

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
  }, [emblaApi, onSelect]);

  // Debug: verificar datos
  useEffect(() => {
    if (!isLoading && birthdays.length > 0) {
      console.log('Total cumpleaños recibidos:', birthdays.length);
      console.log('Fecha de hoy:', todayStr);
      console.log('Cumpleaños de hoy encontrados:', todayBirthdays.length);
      if (todayBirthdays.length === 0) {
        console.log('Ejemplos de fechas recibidas:', birthdays.slice(0, 3).map(b => ({
          name: b.name,
          field_birthdate: b.field_birthdate
        })));
      }
    }
  }, [birthdays, isLoading, todayStr, todayBirthdays.length]);

  if (isLoading) return <BirthdaySliderSkeleton />;

  if (error) {
    console.error('Error al cargar cumpleaños:', error);
    return (
      <div className="bg-white p-3 border rounded-xl">
        <h3 className="text-lg mb-2">Cumpleaños de Hoy</h3>
        <p className="text-sm text-muted-foreground text-center py-6">
          Error al cargar los cumpleaños
        </p>
      </div>
    );
  }

  if (todayBirthdays.length === 0)
    return (
      <div className="bg-white p-3 border rounded-xl">
        <h3 className="text-lg mb-2">Cumpleaños de Hoy</h3>
        <p className="text-sm text-muted-foreground text-center py-6">
          No hay cumpleaños hoy 🎈
        </p>
      </div>
    );

  return (
    <div className="bg-white p-3 border rounded-xl">
      <h3 className="text-lg mb-4">Cumpleaños de Hoy</h3>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {grouped.map((pair, index) => (
            <div
              key={index}
              className="flex-[0_0_100%] flex flex-col gap-4 px-1"
            >
              {pair.map((person, i) => {
                const displayName =
                  person.field_full_name?.trim() || person.name;

                return (
                  <div
                    key={i}
                    onClick={() => {
                      setSelectedBirthday(person);
                      setIsModalOpen(true);
                    }}
                    className="flex items-center gap-3 p-3 bg-[#f8fafc] rounded-lg cursor-pointer hover:bg-[#e2e8f0] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#2deb79]/20 flex items-center justify-center overflow-hidden relative flex-shrink-0">
                      {person.profileImage ? (
                        <Image
                          src={person.profileImage}
                          alt={displayName}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : (
                        <User className="text-[#2deb79] h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-800">
                        {displayName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {person.area || "Área no especificada"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center mt-3 gap-2">
        {grouped.map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === selectedIndex ? "bg-[#2deb79]" : "bg-gray-300"
            }`}
          />
        ))}
      </div>

      {/* Modal de cumpleaños */}
      <BirthdayModal
        birthday={selectedBirthday}
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedBirthday(null);
        }}
      />
    </div>
  );
}

function BirthdaySliderSkeleton() {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm">
      <Skeleton className="h-6 w-48 mb-4" />
      <div className="overflow-hidden">
        <div className="flex gap-4">
          {Array.from({ length: 1 }).map((_, slideIndex) => (
            <div
              key={slideIndex}
              className="flex-[0_0_100%] flex flex-col gap-4 px-1"
            >
              {Array.from({ length: 1 }).map((_, cardIndex) => (
                <div
                  key={`${slideIndex}-${cardIndex}`}
                  className="flex items-center gap-3 p-3 bg-[#f8fafc] rounded-lg"
                >
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center mt-3 gap-2">
        {Array.from({ length: 1 }).map((_, index) => (
          <Skeleton key={index} className="w-2 h-2 rounded-full" />
        ))}
      </div>
    </div>
  );
}
