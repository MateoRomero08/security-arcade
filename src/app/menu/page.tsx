"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArcadeHeader } from "@/components/arcade/ArcadeHeader";
import { MascotAuditor } from "@/components/arcade/MascotAuditor";
import { usePlayerStore, MAX_GAME_ATTEMPTS } from "@/stores/playerStore";
import { synth } from "@/lib/audio/synth";

export default function MenuHubPage() {
  const router = useRouter();
  const player = usePlayerStore((s) => s.player);
  const clearPlayer = usePlayerStore((s) => s.clearPlayer);
  const isSoundMuted = usePlayerStore((s) => s.isSoundMuted);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!player) {
      router.push("/registro");
      return;
    }

    // Start upbeat retro arcade lobby music if audio is unmuted
    if (!isSoundMuted) {
      synth.startLobbyMusic();
    }

    return () => {
      synth.stopLobbyMusic();
    };
  }, [player, router, isSoundMuted]);

  if (!mounted || !player) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg text-white">
        <div className="animate-pulse font-mono text-sm text-brand-primary">
          Loading Arcade...
        </div>
      </div>
    );
  }

  const totalScore = (player.bestScoreAuditor || 0) + (player.bestScoreFraud || 0);

  const attemptsAuditor = player.attemptsAuditor || 0;
  const attemptsFraud = player.attemptsFraud || 0;

  const canPlayAuditor = attemptsAuditor < MAX_GAME_ATTEMPTS;
  const canPlayFraud = attemptsFraud < MAX_GAME_ATTEMPTS;

  const handleLogout = () => {
    synth.playTap();
    synth.stopLobbyMusic();
    clearPlayer();
    router.push("/registro");
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-brand-bg text-white font-sans">
      <ArcadeHeader />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 flex flex-col gap-6 animate-fade-slide-up">
        {/* Welcome & Total Score Banner */}
        <div className="icx-card rounded-3xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="animate-float-slow shrink-0">
              <MascotAuditor mood="happy" size={68} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-primary/15 text-brand-primary border border-brand-primary/30">
                  {player.area}
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/30">
                  Max 2 Attempts / Game
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
                Hello, {player.name.split(" ")[0]}!
              </h1>
              <p className="text-xs text-brand-muted">
                You have up to 2 attempts per minigame to record your best score for your department.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="icx-subcard px-5 py-3 rounded-2xl text-right">
              <span className="text-[10px] font-mono uppercase tracking-wider text-brand-muted block">
                Total Score
              </span>
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-brand-primary">
                {totalScore} pts
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="btn-interactive h-12 px-3.5 rounded-2xl icx-subcard text-xs font-bold text-brand-muted hover:text-white"
              title="Change player"
            >
              Switch
            </button>
          </div>
        </div>

        {/* The 2 Main Game Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* MODE 1: THE AUDITOR IS COMING! */}
          <div className={`icx-card rounded-3xl p-6 sm:p-7 flex flex-col justify-between group transition duration-300 ${
            canPlayAuditor ? "hover:border-brand-primary/60" : "opacity-85 border-amber-500/30"
          }`}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-brand-primary/15 text-brand-primary font-mono text-xs font-extrabold">
                  MODE 1 · OPERATIONS FLOOR
                </span>
                <span className="font-mono text-xs text-brand-muted">
                  Best:{" "}
                  <strong className="text-brand-primary">
                    {player.bestScoreAuditor || 0} pts
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl">🕵️‍♂️</span>
                <h2 className="text-2xl font-extrabold text-white group-hover:text-brand-primary transition">
                  The Auditor is Coming!
                </h2>
              </div>

              <p className="text-sm text-brand-muted leading-relaxed mb-4">
                The auditor is walking toward your workstation.
                Inspect notes, screens, devices, and reports before the timer ends.
                Decide what is <strong>allowed</strong> and what is an <strong>infraction</strong>.
              </p>

              {/* Attempts Tracker Pill */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#041409] border border-brand-primary/20 mb-6 text-xs">
                <span className="text-brand-muted font-medium">Attempts Used:</span>
                <span className={`font-mono font-bold ${canPlayAuditor ? "text-brand-primary" : "text-amber-400"}`}>
                  {attemptsAuditor} / {MAX_GAME_ATTEMPTS} {canPlayAuditor ? `(${MAX_GAME_ATTEMPTS - attemptsAuditor} remaining)` : "· Locked 🔒"}
                </span>
              </div>
            </div>

            {canPlayAuditor ? (
              <Link
                href="/juego-1"
                onClick={() => {
                  synth.stopLobbyMusic();
                  synth.playCoin();
                }}
                className="btn-interactive btn-icx-primary w-full h-14 rounded-2xl font-extrabold text-base flex items-center justify-center gap-2"
              >
                <span>PLAY AUDIT (ATTEMPT {attemptsAuditor + 1}/2)</span>
                <span>→</span>
              </Link>
            ) : (
              <div className="w-full h-14 rounded-2xl icx-subcard border-amber-400/40 text-amber-300 font-extrabold text-sm flex items-center justify-center gap-2 cursor-not-allowed select-none">
                <span>🔒</span>
                <span>2/2 ATTEMPTS COMPLETED</span>
              </div>
            )}
          </div>

          {/* MODE 2: FRAUD HUNTER */}
          <div className={`icx-card rounded-3xl p-6 sm:p-7 flex flex-col justify-between group transition duration-300 ${
            canPlayFraud ? "hover:border-brand-primary/60" : "opacity-85 border-amber-500/30"
          }`}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-brand-primary/15 text-brand-primary font-mono text-xs font-extrabold">
                  MODE 2 · SOCIAL ENGINEERING
                </span>
                <span className="font-mono text-xs text-brand-muted">
                  Best:{" "}
                  <strong className="text-brand-primary">
                    {player.bestScoreFraud || 0} pts
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl">🛡️</span>
                <h2 className="text-2xl font-extrabold text-white group-hover:text-brand-primary transition">
                  Fraud Hunter
                </h2>
              </div>

              <p className="text-sm text-brand-muted leading-relaxed mb-4">
                Incoming communications across multiple channels: urgent emails,
                support chats, vishing calls, and push alerts.
                Protect your 3 shields by detecting traps and legitimate requests.
              </p>

              {/* Attempts Tracker Pill */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#041409] border border-brand-primary/20 mb-6 text-xs">
                <span className="text-brand-muted font-medium">Attempts Used:</span>
                <span className={`font-mono font-bold ${canPlayFraud ? "text-brand-primary" : "text-amber-400"}`}>
                  {attemptsFraud} / {MAX_GAME_ATTEMPTS} {canPlayFraud ? `(${MAX_GAME_ATTEMPTS - attemptsFraud} remaining)` : "· Locked 🔒"}
                </span>
              </div>
            </div>

            {canPlayFraud ? (
              <Link
                href="/juego-2"
                onClick={() => {
                  synth.stopLobbyMusic();
                  synth.playCoin();
                }}
                className="btn-interactive btn-icx-primary w-full h-14 rounded-2xl font-extrabold text-base flex items-center justify-center gap-2"
              >
                <span>PLAY FRAUD HUNTER (ATTEMPT {attemptsFraud + 1}/2)</span>
                <span>→</span>
              </Link>
            ) : (
              <div className="w-full h-14 rounded-2xl icx-subcard border-amber-400/40 text-amber-300 font-extrabold text-sm flex items-center justify-center gap-2 cursor-not-allowed select-none">
                <span>🔒</span>
                <span>2/2 ATTEMPTS COMPLETED</span>
              </div>
            )}
          </div>
        </div>

        {/* Secondary Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Leaderboard */}
          <Link
            href="/ranking"
            className="icx-card rounded-2xl p-4 flex items-center gap-3.5 hover:border-brand-primary/60 transition group"
          >
            <span className="w-12 h-12 rounded-xl bg-brand-primary/15 flex items-center justify-center text-2xl group-hover:scale-105 transition">
              🏆
            </span>
            <div>
              <h3 className="font-extrabold text-sm text-white group-hover:text-brand-primary transition">
                Leaderboard
              </h3>
              <p className="text-[11px] text-brand-muted">
                Individual & Department rankings
              </p>
            </div>
          </Link>

          {/* Glossary */}
          <Link
            href="/glosario"
            className="icx-card rounded-2xl p-4 flex items-center gap-3.5 hover:border-brand-primary/60 transition group"
          >
            <span className="w-12 h-12 rounded-xl bg-brand-primary/15 flex items-center justify-center text-2xl group-hover:scale-105 transition">
              📖
            </span>
            <div>
              <h3 className="font-extrabold text-sm text-white group-hover:text-brand-primary transition">
                Security Glossary
              </h3>
              <p className="text-[11px] text-brand-muted">
                PAN, SAD, CVV, CDE, MFA, QSA
              </p>
            </div>
          </Link>

          {/* Big Screen TV Mode */}
          <Link
            href="/tv"
            className="icx-card rounded-2xl p-4 flex items-center gap-3.5 hover:border-brand-primary/60 transition group"
          >
            <span className="w-12 h-12 rounded-xl bg-brand-primary/15 flex items-center justify-center text-2xl group-hover:scale-105 transition">
              📺
            </span>
            <div>
              <h3 className="font-extrabold text-sm text-white group-hover:text-brand-primary transition">
                Event TV Mode
              </h3>
              <p className="text-[11px] text-brand-muted">
                Live projection screen with QR
              </p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
