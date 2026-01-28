interface GameInstructionsProps {
  text: string | null | undefined;
}

export default function GameInstructions({ text }: GameInstructionsProps) {
  // No mostrar nada si no hay texto
  if (!text || text.trim() === "") {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="bg-gradient-to-r from-[#e6fff2] via-[#e6fff2] to-white border-l-4 border-[#09d6a6] rounded-lg p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#09d6a6] to-[#0bc9a0] rounded-lg flex items-center justify-center text-white text-xl  shadow-md">
            ℹ️
          </div>
          <div className="flex-1">
            <h3 className="text-base  text-[#09d6a6] mb-1.5">
              Instrucciones
            </h3>
            <p className="text-gray-700 leading-relaxed text-sm">{text}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
