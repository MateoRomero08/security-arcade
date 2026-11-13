"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { usePlayerStore } from "@/stores/playerStore";
import { synth } from "@/lib/audio/synth";

export default function ArcadeStartScreen() {
  const router = useRouter();
  const player = usePlayerStore((s) => s.player);
  const isSoundMuted = usePlayerStore((s) => s.isSoundMuted);
  const toggleSound = usePlayerStore((s) => s.toggleSound);

  const [mounted, setMounted] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  useEffect(() => {
    setMounted(true);
    synth.setMusicMuted(isSoundMuted);

    // Auto-attempt start of retro lobby music on first user tap/click
    const handleFirstInteraction = () => {
      if (!isSoundMuted) {
        synth.startLobbyMusic();
      }
    };

    window.addEventListener("click", handleFirstInteraction, { once: true });
    window.addEventListener("touchstart", handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
      synth.stopLobbyMusic();
    };
  }, [isSoundMuted]);

  const handlePlayClick = () => {
    synth.stopLobbyMusic();
    synth.playCoin();
    if (player) {
      router.push("/menu");
    } else {
      router.push("/registro");
    }
  };

  const handleOptionClick = (path?: string) => {
    synth.stopLobbyMusic();
    synth.playTap();
    if (path) router.push(path);
  };

  const handleToggleAudio = () => {
    toggleSound();
    if (isSoundMuted) {
      synth.playTap();
      synth.startLobbyMusic();
    } else {
      synth.stopLobbyMusic();
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#031207] flex items-center justify-center overflow-hidden font-sans">
      {/* Contenedor simulador de pantalla de smartphone (máx 430px) */}
      <div
        className="relative w-full max-w-[430px] min-h-[100dvh] h-full flex flex-col justify-between overflow-hidden shadow-2xl"
        style={{
          backgroundImage: "url('/images/arcade-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Capa de scanlines y partículas sutiles */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-[#020e05]/85" />

        {/* -------------------------------------------------------------
            ZONA SUPERIOR: Espacio reservado para el título de la imagen
            "SECURITY ARCADE" (renderizado con arte 3D neón en la imagen)
            ------------------------------------------------------------- */}
        <div className="relative z-10 w-full pt-6 px-4 flex items-center justify-between">
          {/* Badge sutil de evento */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#051B0B]/70 border border-[#43E568]/30 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#43E568] animate-pulse" />
            <span className="text-[9px] font-pixel text-[#43E568] tracking-widest uppercase">
              FRAUD AWARENESS WEEK
            </span>
          </div>

          {/* Botón de Sonido compacto en la esquina superior */}
          <button
            type="button"
            onClick={handleToggleAudio}
            className="w-8 h-8 rounded-xl bg-[#051B0B]/70 border border-[#43E568]/30 backdrop-blur-md flex items-center justify-center text-xs text-white hover:border-[#43E568] transition-transform active:scale-90"
            title={isSoundMuted ? "Unmute arcade music" : "Mute arcade music (SFX always play)"}
            aria-label="Toggle sound"
          >
            {isSoundMuted ? "🔇" : "🔊"}
          </button>
        </div>

        {/* Espaciador flexible para respetar el arte del logo de la imagen */}
        <div className="flex-1 min-h-[30vh] sm:min-h-[34vh]" />

        {/* -------------------------------------------------------------
            ZONA MEDIA-INFERIOR: MENÚ, BOTÓN DE PLAY Y OPCIONES PEQUEÑAS
            ------------------------------------------------------------- */}
        <div className="relative z-20 w-full px-5 pb-6 flex flex-col items-center gap-4 text-center">
          
          {/* Tarjeta de estado si ya hay jugador activo */}
          {mounted && player && (
            <div className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#072411]/85 border border-[#43E568]/25 backdrop-blur-md text-[11px]">
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-[#43E568]" />
                <span className="text-slate-300 font-medium truncate">
                  Player: <strong className="text-white">{player.shortName}</strong>
                </span>
                <span className="text-[10px] text-[#43E568]/80 font-mono">
                  ({player.area})
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  synth.stopLobbyMusic();
                  synth.playTap();
                  router.push("/registro");
                }}
                className="text-[10px] text-[#43E568] hover:underline font-bold shrink-0 ml-2"
              >
                Change
              </button>
            </div>
          )}

          {/* BOTÓN PRINCIPAL DE PLAY (Arcade Neón Vibrante) */}
          <button
            type="button"
            onClick={handlePlayClick}
            className="group relative w-full h-16 sm:h-[70px] rounded-2xl bg-gradient-to-r from-[#43E568] via-[#5af37d] to-[#36cf5a] p-0.5 shadow-[0_0_30px_rgba(67,229,104,0.55),0_5px_0_#146a2a] transition-all duration-200 active:translate-y-1 active:shadow-[0_0_15px_rgba(67,229,104,0.4),0_1px_0_#146a2a] active:scale-[0.985] select-none"
          >
            <div className="w-full h-full rounded-[14px] bg-gradient-to-b from-[#43E568] to-[#2cb74d] flex items-center justify-center gap-3 px-6">
              <span className="text-2xl sm:text-3xl filter drop-shadow animate-pulse">
                🕹️
              </span>
              <span className="font-arcade text-base sm:text-lg tracking-wider text-[#051B0B] font-black drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]">
                {mounted && player ? "PLAY NOW" : "PRESS START"}
              </span>
              <span className="font-arcade text-xs text-[#051B0B] opacity-80 group-hover:translate-x-1 transition-transform">
                ▶
              </span>
            </div>
          </button>

          {/* OPCIONES PEQUEÑAS (Compactas, elegantes y acordes al estilo) */}
          <div className="grid grid-cols-3 gap-2 w-full pt-1">
            {/* Opción 1: LEADERBOARD */}
            <button
              type="button"
              onClick={() => handleOptionClick("/ranking")}
              className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl bg-[#06200e]/85 border border-[#43E568]/30 backdrop-blur-md hover:border-[#43E568] hover:bg-[#0a2e15] transition-all active:scale-95 group shadow-lg"
            >
              <span className="text-lg group-hover:scale-110 transition-transform">
                🏆
              </span>
              <span className="font-pixel text-[10px] text-slate-200 tracking-wider mt-1 group-hover:text-[#43E568]">
                RANKING
              </span>
            </button>

            {/* Opción 2: HOW TO PLAY */}
            <button
              type="button"
              onClick={() => {
                synth.playTap();
                setShowHowToPlay(true);
              }}
              className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl bg-[#06200e]/85 border border-[#43E568]/30 backdrop-blur-md hover:border-[#43E568] hover:bg-[#0a2e15] transition-all active:scale-95 group shadow-lg"
            >
              <span className="text-lg group-hover:scale-110 transition-transform">
                ❓
              </span>
              <span className="font-pixel text-[10px] text-slate-200 tracking-wider mt-1 group-hover:text-[#43E568]">
                RULES
              </span>
            </button>

            {/* Opción 3: GLOSSARY */}
            <button
              type="button"
              onClick={() => handleOptionClick("/glosario")}
              className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl bg-[#06200e]/85 border border-[#43E568]/30 backdrop-blur-md hover:border-[#43E568] hover:bg-[#0a2e15] transition-all active:scale-95 group shadow-lg"
            >
              <span className="text-lg group-hover:scale-110 transition-transform">
                📖
              </span>
              <span className="font-pixel text-[10px] text-slate-200 tracking-wider mt-1 group-hover:text-[#43E568]">
                GLOSSARY
              </span>
            </button>
          </div>

          {/* -------------------------------------------------------------
              PIE: LOGO DE INTOUCHCX EN LA ESQUINA INFERIOR
              ------------------------------------------------------------- */}
          <div className="w-full flex items-center justify-between pt-3 mt-1 border-t border-[#43E568]/20 text-[10px]">
            {/* Logo de InTouchCX en la esquina inferior izquierda */}
            <div className="flex items-center gap-2 select-none">
              <BrandLogo
                svgClassName="h-6 sm:h-7 w-auto drop-shadow-[0_0_8px_rgba(67,229,104,0.4)]"
              />
            </div>

            {/* Versión / Tag normativo discreto en la otra esquina */}
            <div className="font-pixel text-[9px] text-[#A3C6AD]/80 tracking-wider text-right">
              PCI DSS · v4.0.1
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------------
            MODAL RÁPIDO: HOW TO PLAY / RULES (En Inglés)
            ------------------------------------------------------------- */}
        {showHowToPlay && (
          <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md p-5 flex flex-col justify-center items-center animate-fade-slide-up">
            <div className="w-full max-w-sm rounded-3xl bg-[#06200E] border-2 border-[#43E568]/60 p-5 space-y-4 shadow-[0_0_35px_rgba(67,229,104,0.3)]">
              <div className="flex items-center justify-between pb-2 border-b border-[#43E568]/25">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🕹️</span>
                  <h3 className="font-arcade text-xs text-[#43E568] tracking-wider">
                    HOW TO PLAY
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHowToPlay(false)}
                  className="w-7 h-7 rounded-lg bg-[#0D2E16] text-white hover:text-[#43E568] flex items-center justify-center font-bold text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-left text-xs">
                <div className="p-2.5 rounded-xl bg-[#041509] border border-[#43E568]/20 flex items-start gap-2.5">
                  <span className="font-arcade text-[#43E568] text-xs">01</span>
                  <p className="text-slate-200 leading-snug">
                    <strong className="text-white">Audit Inspector:</strong> Clean the desk before the auditor enters the room. Keep permitted items, dispose of infractions. Max 2 attempts per employee.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-[#041509] border border-[#43E568]/20 flex items-start gap-2.5">
                  <span className="font-arcade text-[#43E568] text-xs">02</span>
                  <p className="text-slate-200 leading-snug">
                    <strong className="text-white">Fraud Hunter:</strong> Identify phishing, rogue calls and MFA push bombing. Protect your 3 shields! Max 2 attempts.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-[#041509] border border-[#43E568]/20 flex items-start gap-2.5">
                  <span className="font-arcade text-[#43E568] text-xs">03</span>
                  <p className="text-slate-200 leading-snug">
                    <strong className="text-white">Score & Compete:</strong> Fast, accurate decisions boost your combo streak and area rank.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowHowToPlay(false)}
                className="w-full h-11 rounded-xl bg-[#43E568] text-[#051B0B] font-arcade text-xs font-black tracking-wider hover:brightness-105 active:scale-95 transition"
              >
                GOT IT!
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
