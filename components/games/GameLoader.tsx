interface GameLoaderProps {
  message?: string;
}

export default function GameLoader({ message = "Cargando juego..." }: GameLoaderProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="text-center space-y-6 px-6">
        {/* Spinner animado mejorado */}
        <div className="relative mx-auto w-24 h-24">
          {/* Círculo exterior girando */}
          <div className="absolute inset-0 border-4 border-[#306393]/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-[#306393] rounded-full animate-spin"></div>
          
          {/* Círculo interior */}
          <div className="absolute inset-3 border-4 border-purple-200 rounded-full"></div>
          <div className="absolute inset-3 border-4 border-transparent border-t-purple-500 rounded-full animate-spin [animation-direction:reverse] [animation-duration:0.8s]"></div>
          
          {/* Icono central */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-[#306393] to-purple-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-2xl">🎮</span>
            </div>
          </div>
        </div>

        {/* Texto de carga con animación */}
        <div className="space-y-2">
          <h3 className="text-xl  text-gray-800 animate-pulse">
            {message}
          </h3>
          <p className="text-sm text-gray-500">
            Preparando tu experiencia de juego...
          </p>
        </div>

        {/* Indicador de progreso animado */}
        <div className="flex justify-center gap-2 mt-8">
          <div className="w-2 h-2 bg-[#306393] rounded-full animate-bounce [animation-delay:0s]"></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
          <div className="w-2 h-2 bg-[#306393] rounded-full animate-bounce [animation-delay:0.4s]"></div>
        </div>
      </div>
    </div>
  );
}

