"use client";

import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { SoundToggle } from "@/components/arcade/SoundToggle";
import { usePlayerStore } from "@/stores/playerStore";

interface ArcadeHeaderProps {
  showBackToMenu?: boolean;
  onBackToMenu?: () => void;
  onOpenRankingModal?: () => void;
}

export const ArcadeHeader: React.FC<ArcadeHeaderProps> = ({
  showBackToMenu = false,
  onBackToMenu,
  onOpenRankingModal,
}) => {
  const player = usePlayerStore((s) => s.player);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-brand-primary/20 bg-brand-bg/85 backdrop-blur-xl">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Brand Logo with optional exit interceptor */}
        {onBackToMenu ? (
          <button
            type="button"
            onClick={onBackToMenu}
            className="flex items-center gap-3 group focus:outline-none text-left cursor-pointer"
            title="Return to Menu"
          >
            <BrandLogo showTagline className="transition-transform duration-300 group-hover:scale-[1.02]" />
          </button>
        ) : (
          <Link
            href={player ? "/menu" : "/"}
            className="flex items-center gap-3 group focus:outline-none text-left"
            title="Security Arcade"
          >
            <BrandLogo showTagline className="transition-transform duration-300 group-hover:scale-[1.02]" />
          </Link>
        )}

        {/* Controls: Player Pill, Ranking/QR and Sound */}
        <div className="flex items-center gap-2">
          {/* Active Player Pill */}
          {player && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full icx-subcard text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
              <span className="truncate max-w-[150px]">{player.shortName}</span>
              <span className="text-[10px] text-brand-muted">· {player.area}</span>
            </div>
          )}

          {/* Leaderboard Button */}
          {onOpenRankingModal ? (
            <button
              type="button"
              onClick={onOpenRankingModal}
              className="btn-interactive h-10 px-3.5 rounded-xl icx-subcard hover:border-brand-primary/60 text-xs font-extrabold flex items-center gap-2 text-white"
            >
              <span className="text-brand-primary">🏆</span>
              <span className="hidden sm:inline">Leaderboard</span>
            </button>
          ) : (
            <Link
              href="/ranking"
              className="btn-interactive h-10 px-3.5 rounded-xl icx-subcard hover:border-brand-primary/60 text-xs font-extrabold flex items-center gap-2 text-white"
            >
              <span className="text-brand-primary">🏆</span>
              <span className="hidden sm:inline">Leaderboard</span>
            </Link>
          )}

          {/* Menu Button with exit confirmation support */}
          {showBackToMenu && (
            onBackToMenu ? (
              <button
                type="button"
                onClick={onBackToMenu}
                className="btn-interactive h-10 px-3.5 rounded-xl icx-subcard hover:border-brand-primary/60 text-xs font-bold text-brand-muted hover:text-white flex items-center gap-1.5"
              >
                <span>←</span>
                <span>Menu</span>
              </button>
            ) : (
              <Link
                href="/menu"
                className="btn-interactive h-10 px-3.5 rounded-xl icx-subcard hover:border-brand-primary/60 text-xs font-bold text-brand-muted hover:text-white flex items-center gap-1.5"
              >
                <span>←</span>
                <span>Menu</span>
              </Link>
            )
          )}

          {/* Audio Synthesizer Toggle */}
          <SoundToggle />
        </div>
      </div>
    </header>
  );
};

export default ArcadeHeader;
