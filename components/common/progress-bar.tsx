import { cn } from "@/lib/utils";
import React from "react";

interface ProgressBarProps {
  className?: string;
}

export function ProgressBar({ className }: ProgressBarProps) {
  return (
    <div
      className={cn(
        "relative inline-block w-[60px] h-[10px] mt-1 bg-[#00efbd] rounded-full",
        className
      )}
    >
      <div className="absolute left-0 z-20 w-[70%] h-full rounded-full bg-[#00a1ee]" />
    </div>
  );
}
