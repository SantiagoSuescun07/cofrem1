import api from "@/lib/axios";
import { PicoYPlacaData } from "@/types";

export async function fetchPicoYPlaca(): Promise<PicoYPlacaData> {
  try {
    const response = await api.get("/api/pico-y-placa", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa("admin:admin"),
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching pico y placa:", error);
    // Retornar estructura vacía en caso de error
    return {
      pico_y_placa: {
        Lunes: { placas: [], horarios: [] },
        Martes: { placas: [], horarios: [] },
        Miércoles: { placas: [], horarios: [] },
        Jueves: { placas: [], horarios: [] },
        Viernes: { placas: [], horarios: [] },
        Sábado: { placas: [], horarios: [] },
        Domingo: { placas: [], horarios: [] },
      },
    };
  }
}

