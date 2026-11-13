"use client";

import React, { useEffect, useState } from "react";
import { synth } from "@/lib/audio/synth";
import { usePlayerStore } from "@/stores/playerStore";

export const SoundToggle: React.FC<{ className?: string }> = ({ className = "" }) => {
  const isSoundMuted = usePlayerStore((s) => s.isSoundMuted);
  const toggleSound = usePlayerStore((s) => s.toggleSound);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    synth.setMuted(isSoundMuted);
  }, [isSoundMuted]);

  if (!mounted) {
    return (
      <div className={`w-10 h-10 rounded-xl icx-subcard flex items-center justify-center text-sm ${className}`}>
        🔊
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        toggleSound();
        if (isSoundMuted) synth.playTap();
      }}
      className={`btn-interactive w-10 h-10 rounded-xl icx-subcard hover:border-brand-primary/60 flex items-center justify-center text-sm transition-colors ${className}`}
      title={isSoundMuted ? "Activar Sonido" : "Silenciar"}
      aria-label="Control de audio"
    >
      <span>{isSoundMuted ? "🔇" : "🔊"}</span>
    </button>
  );
};

export default SoundToggle;

