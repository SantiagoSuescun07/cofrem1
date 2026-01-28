"use client";

import { useState, useEffect, useCallback } from "react";

interface Cell {
  row: number;
  col: number;
}

interface FoundWordData {
  word: string;
  positions: Cell[];
  color: string;
}

interface WordGridProps {
  words: string[];
  gridSize: number;
  directions: {
    horizontal: boolean;
    vertical: boolean;
    diagonal: boolean;
    reverse: boolean;
  };
  onWordFound: (word: string, positions: Cell[]) => void;
  foundWordsData: FoundWordData[];
  difficulty: "easy" | "medium" | "hard";
}

const generateGrid = (
  words: string[],
  size: number,
  directions: { horizontal: boolean; vertical: boolean; diagonal: boolean }
): { grid: string[][]; wordPositions: Record<string, Cell[]> } => {
  const grid: string[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill(""));

  const wordPositions: Record<string, Cell[]> = {};

  const canPlace = (
    word: string,
    start: Cell,
    dir: string,
    g: string[][]
  ): boolean => {
    const { row, col } = start;
    for (let i = 0; i < word.length; i++) {
      let r = row,
        c = col;
      if (dir === "H") c += i;
      else if (dir === "V") r += i;
      else if (dir === "D") {
        r += i;
        c += i;
      }
      if (r >= g.length || c >= g[0].length || r < 0 || c < 0) return false;
      if (g[r][c] !== "" && g[r][c] !== word[i]) return false;
    }
    return true;
  };

  const placeWord = (
    word: string,
    start: Cell,
    dir: string,
    g: string[][]
  ): Cell[] => {
    const { row, col } = start;
    const positions: Cell[] = [];
    for (let i = 0; i < word.length; i++) {
      let r = row,
        c = col;
      if (dir === "H") c += i;
      else if (dir === "V") r += i;
      else if (dir === "D") {
        r += i;
        c += i;
      }
      g[r][c] = word[i];
      positions.push({ row: r, col: c });
    }
    return positions;
  };

  const getRandomStart = (len: number, size: number, dir: string): Cell => {
    let row: number, col: number;
    if (dir === "H") {
      row = Math.floor(Math.random() * size);
      col = Math.floor(Math.random() * (size - len + 1));
    } else if (dir === "V") {
      row = Math.floor(Math.random() * (size - len + 1));
      col = Math.floor(Math.random() * size);
    } else {
      row = Math.floor(Math.random() * (size - len + 1));
      col = Math.floor(Math.random() * (size - len + 1));
    }
    return { row, col };
  };

  const getValidDirections = (): string[] => {
    const dirs: string[] = [];
    if (directions.horizontal) dirs.push("H");
    if (directions.vertical) dirs.push("V");
    if (directions.diagonal) dirs.push("D");
    return dirs.length > 0 ? dirs : ["H"];
  };

  words.forEach((word: string) => {
    let placed = false;
    let attempts = 0;
    const validDirs = getValidDirections();

    while (!placed && attempts < 50) {
      const dir = validDirs[Math.floor(Math.random() * validDirs.length)];
      const start = getRandomStart(word.length, size, dir);
      if (canPlace(word, start, dir, grid)) {
        const positions = placeWord(word, start, dir, grid);
        wordPositions[word] = positions;
        placed = true;
      }
      attempts++;
    }
  });

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (grid[i][j] === "") {
        grid[i][j] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      }
    }
  }

  return { grid, wordPositions };
};

export default function WordGrid({
  words,
  gridSize,
  directions,
  onWordFound,
  foundWordsData,
  difficulty,
}: WordGridProps) {
  const [grid, setGrid] = useState<string[][]>([]);
  const [wordPositionsMap, setWordPositionsMap] = useState<
    Record<string, Cell[]>
  >({});
  const [selectedCells, setSelectedCells] = useState<Cell[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);

  useEffect(() => {
    const { grid: newGrid, wordPositions } = generateGrid(
      words,
      gridSize,
      directions
    );
    setGrid(newGrid);
    setWordPositionsMap(wordPositions);
  }, [words, gridSize, directions]);

  const handleMouseDown = (row: number, col: number) => {
    setIsSelecting(true);
    setSelectedCells([{ row, col }]);
  };

  const handleMouseEnter = (row: number, col: number) => {
    if (!isSelecting || selectedCells.length === 0) return;

    const start = selectedCells[0];
    const dr = row - start.row;
    const dc = col - start.col;
    let isValid = false;

    if (dr === 0 && dc !== 0 && directions.horizontal) isValid = true;
    else if (dc === 0 && dr !== 0 && directions.vertical) isValid = true;
    else if (Math.abs(dr) === Math.abs(dc) && directions.diagonal)
      isValid = true;

    if (!isValid) return;

    const steps = Math.max(Math.abs(dr), Math.abs(dc));
    const newSelection: Cell[] = [];

    for (let i = 0; i <= steps; i++) {
      const r = start.row + (dr === 0 ? 0 : dr > 0 ? i : -i);
      const c = start.col + (dc === 0 ? 0 : dc > 0 ? i : -i);
      if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
        newSelection.push({ row: r, col: c });
      }
    }

    setSelectedCells(newSelection);
  };

  const handleMouseUp = useCallback(() => {
    if (!isSelecting) return;
    setIsSelecting(false);

    let word = "";
    selectedCells.forEach(({ row, col }) => {
      if (row < gridSize && col < gridSize) {
        word += grid[row][col];
      }
    });

    const normalized = word.toUpperCase();
    const reversed = normalized.split("").reverse().join("");
    let foundWord: string | null = null;
    let foundPositions: Cell[] = [];

    for (const [w, positions] of Object.entries(wordPositionsMap)) {
      const cellsMatch = (positions: Cell[], candidate: Cell[]): boolean => {
        if (positions.length !== candidate.length) return false;
        return positions.every(
          (p, i) => p.row === candidate[i].row && p.col === candidate[i].col
        );
      };

      if (w === normalized && cellsMatch(positions, selectedCells)) {
        foundWord = w;
        foundPositions = positions;
        break;
      }

      if (
        directions.reverse &&
        w === reversed &&
        cellsMatch(positions, [...selectedCells].reverse())
      ) {
        foundWord = w;
        foundPositions = positions;
        break;
      }
    }

    if (foundWord) {
      onWordFound(foundWord, foundPositions);
    }

    setSelectedCells([]);
  }, [
    isSelecting,
    selectedCells,
    grid,
    wordPositionsMap,
    directions,
    onWordFound,
    gridSize,
  ]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isSelecting) handleMouseUp();
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [isSelecting, handleMouseUp]);

  const getCellColor = (row: number, col: number): string | null => {
    if (difficulty === "hard") return null;
    for (const data of foundWordsData) {
      if (data.positions.some((p) => p.row === row && p.col === col)) {
        return data.color;
      }
    }
    return null;
  };

  const isCellSelected = (row: number, col: number): boolean => {
    return selectedCells.some((cell) => cell.row === row && cell.col === col);
  };

  if (grid.length === 0)
    return (
      <div className="text-center p-8 text-gray-600">
        <span className="text-2xl">🌀</span> Generando sopa de letras...
      </div>
    );

  return (
    <div
      className="w-full mx-auto select-none overflow-visible"
      onMouseLeave={handleMouseUp}
    >
      <div
        className="grid gap-1.5 justify-items-stretch items-stretch bg-white p-4 sm:p-6 rounded-xl border-2 border-[#09d6a6]/30 shadow-inner w-full"
        style={{ 
          gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
          aspectRatio: '1 / 1'
        }}
      >
        {grid.map((row, i) =>
          row.map((cell, j) => {
            const permanentColor = getCellColor(i, j);
            const isSelected = isCellSelected(i, j);
            const bgColor = isSelected
              ? "#09d6a6"
              : permanentColor
                ? permanentColor
                : "#f9fafb";
            const textColor = isSelected || permanentColor ? "#ffffff" : "#374151";
            const boxShadow = isSelected
              ? "0 0 0 2px rgba(9,214,166,0.3), 0 4px 8px rgba(9,214,166,0.4)"
              : permanentColor
                ? `0 0 0 2px ${permanentColor}30, 0 2px 4px ${permanentColor}20`
                : "0 1px 2px rgba(0,0,0,0.05), inset 0 1px 1px rgba(255,255,255,0.8)";

            return (
              <div
                key={`${i}-${j}`}
                onMouseDown={() => handleMouseDown(i, j)}
                onMouseEnter={() => handleMouseEnter(i, j)}
                className="flex items-center justify-center rounded-lg cursor-pointer  transition-all duration-200 box-border border-2 hover:border-[#09d6a6]/60 hover:shadow-md aspect-square"
                style={{
                  backgroundColor: bgColor,
                  color: textColor,
                  boxShadow,
                  borderColor: isSelected 
                    ? "#09d6a6" 
                    : permanentColor 
                      ? `${permanentColor}40` 
                      : "#e5e7eb",
                  transform: isSelected ? "scale(1.1)" : "scale(1)",
                  fontSize: `clamp(8px, 1.2vw, 12px)`,
                }}
              >
                {cell}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

