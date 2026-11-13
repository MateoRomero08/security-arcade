"use client";

import React from "react";
import { MascotAuditor, AuditorMood } from "@/components/arcade/MascotAuditor";

interface AuditorProgressBarProps {
  timeLeft: number;
  totalTime: number;
  mood?: AuditorMood;
  combo?: number;
}

export const AuditorProgressBar: React.FC<AuditorProgressBarProps> = ({
  timeLeft,
  totalTime,
  mood = "happy",
  combo = 1.0,
}) => {
  const progressPct = Math.min(100, Math.max(0, Math.round(((totalTime - timeLeft) / totalTime) * 100)));

  return (
    <div className="icx-card rounded-2xl p-3 sm:px-4 flex items-center gap-3 w-full">
      {/* Mascota del auditor con expresión dinámica */}
      <div className="shrink-0 transition-transform duration-300">
        <MascotAuditor mood={mood} size={46} showClipboard />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-xs font-bold mb-1">
          <span className="text-brand-muted truncate">
            {progressPct > 75
              ? "🚨 Auditor is walking through the door!"
              : progressPct > 40
              ? "🚶‍♂️ Auditor is heading down the hallway..."
              : "🕵️‍♂️ Auditor reviewing nearby workstations..."}
          </span>
          <span className="font-mono text-base font-extrabold text-brand-primary shrink-0 ml-2">
            {timeLeft}s
          </span>
        </div>

        {/* Barra de progreso */}
        <div className="w-full h-2.5 bg-[#051B0B] rounded-full overflow-hidden p-0.5 border border-brand-primary/20">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              progressPct > 75
                ? "bg-rose-500"
                : progressPct > 45
                ? "bg-amber-400"
                : "bg-brand-primary"
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Combo badge si es mayor a 1.0 */}
      {combo > 1.0 && (
        <div className="icx-subcard px-2.5 py-1 rounded-xl text-center shrink-0 border-brand-primary/40 animate-pulse">
          <span className="text-[9px] uppercase font-bold text-brand-muted block">Combo</span>
          <span className="font-mono text-xs font-extrabold text-brand-primary">
            x{combo.toFixed(1)}
          </span>
        </div>
      )}
    </div>
  );
};

export default AuditorProgressBar;

