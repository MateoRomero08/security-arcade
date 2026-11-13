"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { ArcadeHeader } from "@/components/arcade/ArcadeHeader";
import { AuditorProgressBar } from "@/components/juego-1/AuditorProgressBar";
import { DeskSvg, INFRACTION_KEYS } from "@/components/juego-1/DeskSvg";
import { MascotAuditor, AuditorMood } from "@/components/arcade/MascotAuditor";
import { ExitConfirmModal } from "@/components/arcade/ExitConfirmModal";
import { DonkeyFailPopup } from "@/components/arcade/DonkeyFailPopup";
import { ClientAuditItem, SessionActionLog, SessionResult } from "@/types/game";
import { usePlayerStore, MAX_GAME_ATTEMPTS } from "@/stores/playerStore";
import { synth } from "@/lib/audio/synth";

type GamePhase = "INSTRUCTIONS" | "COUNTDOWN" | "PLAYING" | "GAMEOVER" | "SUMMARY";

export default function AuditorGamePage() {
  const router = useRouter();
  const player = usePlayerStore((s) => s.player);
  const updateScores = usePlayerStore((s) => s.updateScores);
  const incrementAttempts = usePlayerStore((s) => s.incrementAttempts);
  const canPlayGame = usePlayerStore((s) => s.canPlayGame);

  const [phase, setPhase] = useState<GamePhase>("INSTRUCTIONS");
  const [countdown, setCountdown] = useState(3);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showDonkeyPopup, setShowDonkeyPopup] = useState(false);
  const [donkeyMessage, setDonkeyMessage] = useState("");

  // Game session state
  const [sessionId, setSessionId] = useState<string>("");
  const [items, setItems] = useState<ClientAuditItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [combo, setCombo] = useState(1.0);
  const [mood, setMood] = useState<AuditorMood>("happy");

  const [actionsLog, setActionsLog] = useState<SessionActionLog[]>([]);
  const actionStartTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [result, setResult] = useState<SessionResult | null>(null);

  useEffect(() => {
    if (!player) {
      router.push("/registro");
    }
  }, [player, router]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Navigation interceptor to prevent accidental exit
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (phase === "PLAYING" || phase === "COUNTDOWN") {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    const handlePopState = () => {
      if (phase === "PLAYING" || phase === "COUNTDOWN") {
        window.history.pushState(null, "", window.location.href);
        setShowExitModal(true);
      }
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [phase]);

  const attemptsUsed = player?.attemptsAuditor || 0;
  const canPlayThisGame = canPlayGame("AUDITOR");

  const handleStartCountdown = async () => {
    if (!canPlayGame("AUDITOR")) return;

    synth.playCoin();
    setPhase("COUNTDOWN");
    setCountdown(3);
    setResult(null);

    try {
      const res = await fetch("/api/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameType: "AUDITOR", level: 1 }),
      });
      const data = await res.json();
      if (data.items) {
        setSessionId(data.sessionId);
        setItems(data.items);
      }
    } catch {
      // Graceful offline fallback
    }

    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        synth.playTap();
        setCountdown(count);
      } else {
        clearInterval(interval);
        startActualGame();
      }
    }, 1000);
  };

  const startActualGame = () => {
    // Record the attempt when gameplay officially begins
    incrementAttempts("AUDITOR");

    synth.playVictory();
    setPhase("PLAYING");
    setTimeLeft(60);
    setScore(0);
    setStreak(0);
    setCombo(1.0);
    setMood("happy");
    setActiveIndex(0);
    setActionsLog([]);
    actionStartTimeRef.current = Date.now();

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          finishGameTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSelectItem = (idx: number) => {
    if (items[idx]?.resolved) return;
    synth.playTap();
    setActiveIndex(idx);
    actionStartTimeRef.current = Date.now();
  };

  const handleMakeDecision = (action: string) => {
    const currentItem = items[activeIndex];
    if (!currentItem || currentItem.resolved) return;

    const elapsedMs = Date.now() - actionStartTimeRef.current;

    // Check if decision is a mistake to trigger the hilarious Donkey fail
    const isInfraction = INFRACTION_KEYS.has(currentItem.svg_key);
    const isMistake =
      (isInfraction && action === "DEJAR_ESCRITORIO") ||
      (!isInfraction && action === "TRITURAR");

    if (isMistake) {
      setStreak(0);
      setCombo(1.0);
      setMood("suspicious");
      synth.playDonkeyBray(); // Play comic donkey sound!
      setDonkeyMessage(
        isInfraction
          ? "¡I-AAAH! 🐴 Security hazard left on desk!"
          : "¡I-AAAH! 🐴 That item was clean & permitted!"
      );
      setShowDonkeyPopup(true);
    } else {
      const newStreak = streak + 1;
      setStreak(newStreak);
      const newCombo = newStreak >= 5 ? 2.0 : newStreak >= 3 ? 1.5 : 1.0;
      setCombo(newCombo);
      setMood("happy");
      synth.playCorrect(newCombo);
    }

    const log: SessionActionLog = {
      itemId: currentItem.id,
      action,
      clientTimestamp: Date.now(),
      elapsedMs,
    };

    const newLogs = [...actionsLog, log];
    setActionsLog(newLogs);

    const updatedItems = [...items];
    updatedItems[activeIndex] = { ...currentItem, resolved: true };
    setItems(updatedItems);

    const nextIdx = updatedItems.findIndex((it) => !it.resolved);
    if (nextIdx !== -1) {
      setActiveIndex(nextIdx);
      actionStartTimeRef.current = Date.now();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setTimeout(() => submitFinalResults(newLogs, timeLeft, true), 350);
    }
  };

  const finishGameTimeout = () => {
    setMood("shocked");
    synth.playError();
    setPhase("GAMEOVER");
    // Background evaluation so findings are ready when they choose to review
    submitFinalResults(actionsLog, 0, false);
  };

  const submitFinalResults = async (
    finalLogs: SessionActionLog[],
    timeRemaining: number,
    autoShowSummary = true
  ) => {
    try {
      const res = await fetch("/api/session/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          actions: finalLogs,
          timeLeftSeconds: timeRemaining,
          player: player ? {
            id: player.playerId,
            name: player.name,
            shortName: player.shortName,
            area: player.area,
            employeeCode: player.employeeCode,
          } : null,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data: SessionResult = await res.json();
      if (!data || !Array.isArray(data.findings)) {
        throw new Error("Invalid response format");
      }

      setResult(data);
      updateScores("AUDITOR", data.score);

      if (data.score >= 500) {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        synth.playVictory();
      }

      if (autoShowSummary) {
        setPhase("SUMMARY");
      }
    } catch {
      // Robust offline fallback so it NEVER crashes or throws undefined errors
      const fallbackResult: SessionResult = {
        sessionId: sessionId || "offline_session",
        gameType: "AUDITOR",
        score: Math.max(0, finalLogs.length * 50),
        rankLabel: "Audit Incomplete",
        correctCount: finalLogs.length,
        totalCount: items.length || 8,
        accuracy: items.length > 0 ? finalLogs.length / items.length : 0,
        breakdown: {
          basePoints: finalLogs.length * 50,
          comboBonus: 0,
          timeBonus: 0,
          perfectBonus: 0,
          penalties: 0,
        },
        findings: items.map((it) => {
          const action = finalLogs.find((l) => l.itemId === it.id);
          return {
            itemId: it.id,
            titulo: it.nombre,
            decisionTomada: action ? action.action : "Not reviewed in time",
            accionCorrecta: "TRITURAR",
            esCorrecto: !!action,
            puntos: action ? 50 : -40,
            explicacion:
              it.descripcion_corta ||
              "Workstation item was not audited before time expired.",
          };
        }),
      };
      setResult(fallbackResult);
      if (autoShowSummary) {
        setPhase("SUMMARY");
      }
    }
  };

  const handleHeaderBack = () => {
    if (phase === "PLAYING" || phase === "COUNTDOWN") {
      setShowExitModal(true);
    } else {
      router.push("/menu");
    }
  };

  const currentActiveItem = items[activeIndex];
  const resolvedCount = items.filter((it) => it.resolved).length;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-brand-bg text-white font-sans">
      <ArcadeHeader showBackToMenu onBackToMenu={handleHeaderBack} />

      {/* Confirmation Modal against Accidental Exit */}
      <ExitConfirmModal
        isOpen={showExitModal}
        onCancel={() => setShowExitModal(false)}
        onConfirm={() => {
          if (timerRef.current) clearInterval(timerRef.current);
          setShowExitModal(false);
          router.push("/menu");
        }}
      />

      {/* Comic Donkey Fail Pop-up */}
      <DonkeyFailPopup
        show={showDonkeyPopup}
        message={donkeyMessage}
        onDismiss={() => setShowDonkeyPopup(false)}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-4 flex flex-col justify-center">
        {/* ============================================================== */}
        {/* CHECK 2-ATTEMPT LIMIT: IF EXCEEDED RENDER LOCKED SCREEN        */}
        {/* ============================================================== */}
        {!canPlayThisGame && phase === "INSTRUCTIONS" ? (
          <div className="icx-card rounded-3xl p-6 sm:p-8 max-w-md mx-auto w-full text-center space-y-5 animate-fade-slide-up border-2 border-amber-400/40">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-4xl mx-auto">
              🔒
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300">
                ATTEMPTS EXHAUSTED · 2 / 2 USED
              </span>
              <h1 className="text-2xl font-black text-white mt-1">
                Maximum Attempts Reached
              </h1>
              <p className="text-xs text-brand-muted leading-relaxed">
                You have already completed your 2 permitted rounds for this audit challenge.
                Your best score of{" "}
                <strong className="text-brand-primary">
                  {player?.bestScoreAuditor || 0} pts
                </strong>{" "}
                is officially recorded on the leaderboard.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <Link
                href="/ranking"
                className="btn-interactive btn-icx-primary h-12 rounded-xl font-black text-sm flex items-center justify-center gap-2"
              >
                <span>🏆</span>
                <span>VIEW LEADERBOARD</span>
              </Link>
              <Link
                href="/menu"
                className="btn-interactive h-11 rounded-xl icx-subcard text-xs font-bold text-slate-300 hover:text-white flex items-center justify-center gap-1.5"
              >
                <span>←</span>
                <span>Return to Menu</span>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* ============================================================== */}
            {/* PHASE 1: INSTRUCTIONS (3 STEPS)                                */}
            {/* ============================================================== */}
            {phase === "INSTRUCTIONS" && (
              <div className="icx-card rounded-3xl p-6 sm:p-8 max-w-xl mx-auto w-full space-y-6 animate-fade-slide-up">
                <div className="flex items-center gap-4 border-b border-brand-primary/20 pb-5">
                  <MascotAuditor mood="happy" size={64} showClipboard />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-primary/15 text-brand-primary">
                        MODE 1 · OPERATIONS FLOOR
                      </span>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300">
                        Attempt {attemptsUsed + 1} of {MAX_GAME_ATTEMPTS}
                      </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
                      The Auditor is Coming!
                    </h1>
                    <p className="text-xs text-brand-muted">
                      3 quick steps before the timer starts
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3.5 icx-subcard p-3.5 rounded-2xl">
                    <span className="w-7 h-7 rounded-full bg-brand-primary/20 flex items-center justify-center font-mono font-extrabold text-brand-primary text-xs shrink-0">
                      1
                    </span>
                    <p className="text-xs sm:text-sm text-slate-200">
                      <strong className="text-white">Inspect the desk:</strong> 8 items appear on the workstation (sticky notes, screens, devices, and documents).
                    </p>
                  </div>

                  <div className="flex items-start gap-3.5 icx-subcard p-3.5 rounded-2xl">
                    <span className="w-7 h-7 rounded-full bg-brand-primary/20 flex items-center justify-center font-mono font-extrabold text-brand-primary text-xs shrink-0">
                      2
                    </span>
                    <p className="text-xs sm:text-sm text-slate-200">
                      <strong className="text-white">Make decisions:</strong> If compliant, keep it on the desk. If it violates PCI DSS or Clean Desk policy, shred or report it.
                    </p>
                  </div>

                  <div className="flex items-start gap-3.5 icx-subcard p-3.5 rounded-2xl">
                    <span className="w-7 h-7 rounded-full bg-brand-primary/20 flex items-center justify-center font-mono font-extrabold text-brand-primary text-xs shrink-0">
                      3
                    </span>
                    <p className="text-xs sm:text-sm text-slate-200">
                      <strong className="text-white">Build streaks:</strong> You have 60 seconds before the auditor enters the door. Consecutive streaks multiply your score.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStartCountdown}
                  className="btn-interactive btn-icx-primary w-full h-14 rounded-2xl font-extrabold text-base tracking-wide flex items-center justify-center gap-2 mt-4"
                >
                  <span>START ATTEMPT {attemptsUsed + 1} OF 2</span>
                  <span>→</span>
                </button>
              </div>
            )}

            {/* ============================================================== */}
            {/* PHASE 2: COUNTDOWN 3-2-1                                       */}
            {/* ============================================================== */}
            {phase === "COUNTDOWN" && (
              <div className="flex flex-col items-center justify-center my-auto py-12 text-center animate-fade-slide-up">
                <MascotAuditor mood="suspicious" size={100} showClipboard />
                <div className="text-7xl sm:text-8xl font-mono font-black text-brand-primary drop-shadow-[0_0_30px_rgba(67,229,104,0.6)] my-4 animate-ping">
                  {countdown}
                </div>
                <p className="text-sm font-bold uppercase tracking-widest text-brand-muted">
                  The auditor is approaching!
                </p>
              </div>
            )}

            {/* ============================================================== */}
            {/* PHASE 3: ACTIVE GAMEPLAY (Desk + HUD + 2 Touch Buttons)        */}
            {/* ============================================================== */}
            {phase === "PLAYING" && (
              <div className="flex flex-col gap-3.5 w-full animate-fade-slide-up">
                {/* Top HUD with Walking Auditor */}
                <AuditorProgressBar
                  timeLeft={timeLeft}
                  totalTime={60}
                  mood={mood}
                  combo={combo}
                />

                {/* Responsive Desk Vector Scene */}
                <DeskSvg
                  items={items}
                  activeIndex={activeIndex}
                  onSelectItem={handleSelectItem}
                />

                {/* Bottom Decision Bar */}
                <div className="icx-card rounded-3xl p-4 sm:p-5">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                    {/* Active Item Detail */}
                    <div className="lg:col-span-6 flex items-center gap-3.5 icx-subcard rounded-2xl p-3.5">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#051B0B] border border-brand-primary/30 flex items-center justify-center text-3xl shrink-0">
                        {currentActiveItem ? "🔎" : "✔"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-extrabold px-2 py-0.5 rounded bg-brand-primary/20 text-brand-primary">
                            ITEM #{activeIndex + 1} OF {items.length}
                          </span>
                        </div>
                        <h2 className="text-base sm:text-lg font-extrabold text-white truncate mt-0.5">
                          {currentActiveItem?.nombre || "Round complete"}
                        </h2>
                        <p className="text-xs sm:text-sm text-brand-muted line-clamp-2">
                          {currentActiveItem?.descripcion_corta || "Calculating results..."}
                        </p>
                      </div>
                    </div>

                    {/* 2 Decision Buttons */}
                    <div className="lg:col-span-6 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleMakeDecision("DEJAR_ESCRITORIO")}
                        className="btn-interactive btn-allow h-16 sm:h-[68px] rounded-2xl px-3 flex items-center justify-center gap-2.5 font-extrabold text-xs sm:text-sm"
                      >
                        <span className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center text-lg shrink-0">
                          ✅
                        </span>
                        <div className="text-left">
                          <div className="leading-tight">It&apos;s Allowed</div>
                          <div className="text-[10px] font-medium opacity-80">Keep on desk</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMakeDecision("TRITURAR")}
                        className="btn-interactive btn-infraction h-16 sm:h-[68px] rounded-2xl px-3 flex items-center justify-center gap-2.5 font-extrabold text-xs sm:text-sm"
                      >
                        <span className="w-8 h-8 rounded-full bg-rose-500/25 flex items-center justify-center text-lg shrink-0">
                          🚨
                        </span>
                        <div className="text-left">
                          <div className="leading-tight">Infraction</div>
                          <div className="text-[10px] font-medium opacity-80">Shred / Report</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* PHASE 4: TIME UP · GAME OVER SCREEN (AUDITOR CAUGHT YOU)       */}
            {/* ============================================================== */}
            {phase === "GAMEOVER" && (
              <div className="icx-card rounded-3xl p-6 sm:p-9 max-w-xl mx-auto w-full text-center space-y-6 border-2 border-rose-500/40 shadow-[0_0_50px_rgba(239,68,68,0.25)] animate-fade-slide-up">
                <div className="flex justify-center">
                  <div className="relative">
                    <MascotAuditor mood="shocked" size={88} showClipboard />
                    <span className="absolute -bottom-2 -right-2 text-3xl animate-bounce">
                      🚨
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="inline-block px-3.5 py-1 rounded-full text-xs font-mono font-extrabold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    AUDITOR ARRIVED · TIME EXPIRED
                  </span>
                  <h1 className="text-3xl sm:text-4xl font-black text-white tracking-wide">
                    GAME OVER!
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                    The compliance auditor entered your workstation while uninspected security hazards were still on your desk.
                  </p>
                </div>

                {/* Quick stats snapshot */}
                <div className="grid grid-cols-2 gap-3 icx-subcard rounded-2xl p-4">
                  <div className="text-center">
                    <span className="text-[10px] font-mono uppercase text-brand-muted block">
                      Items Handled
                    </span>
                    <span className="text-xl sm:text-2xl font-mono font-black text-white">
                      {resolvedCount} / {items.length}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] font-mono uppercase text-brand-muted block">
                      Score Saved
                    </span>
                    <span className="text-xl sm:text-2xl font-mono font-black text-brand-primary">
                      {result ? result.score : score} pts
                    </span>
                  </div>
                </div>

                {/* Navigation & Action Buttons */}
                <div className="flex flex-col gap-3 pt-2">
                  {canPlayGame("AUDITOR") ? (
                    <button
                      type="button"
                      onClick={handleStartCountdown}
                      className="btn-interactive btn-icx-primary h-14 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2"
                    >
                      <span>🔄</span>
                      <span>TRY AGAIN (ATTEMPT 2 OF 2)</span>
                    </button>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/30 text-xs text-amber-300 font-bold">
                      2 of 2 attempts used · Score saved to leaderboard!
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setPhase("SUMMARY")}
                    className="btn-interactive h-12 rounded-xl icx-subcard border-brand-primary/30 hover:border-brand-primary text-xs sm:text-sm font-bold text-white flex items-center justify-center gap-2"
                  >
                    <span>📋</span>
                    <span>View Findings & Educational Report</span>
                  </button>

                  <Link
                    href="/menu"
                    className="btn-interactive h-11 rounded-xl icx-subcard text-xs font-semibold text-brand-muted hover:text-white flex items-center justify-center gap-1.5"
                  >
                    <span>←</span>
                    <span>Return to Menu</span>
                  </Link>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* PHASE 5: AUDIT FINDINGS REPORT                                 */}
            {/* ============================================================== */}
            {phase === "SUMMARY" && result && (
              <div className="icx-card rounded-3xl p-6 sm:p-8 max-w-4xl mx-auto w-full space-y-6 animate-fade-slide-up">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-brand-primary/20">
                  <div className="flex items-center gap-4">
                    <MascotAuditor
                      mood={result.score >= 500 ? "happy" : "shocked"}
                      size={72}
                      showClipboard
                    />
                    <div>
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-brand-primary/20 text-brand-primary mb-1">
                        {result.rankLabel}
                      </span>
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                        Audit Findings Report
                      </h1>
                      <p className="text-xs sm:text-sm text-brand-muted mt-0.5">
                        You resolved {result.correctCount} of {result.totalCount} items evaluated on the workstation.
                      </p>
                    </div>
                  </div>

                  <div className="icx-subcard rounded-2xl px-6 py-4 text-center self-stretch sm:self-auto flex flex-col justify-center">
                    <span className="text-[10px] font-mono uppercase text-brand-muted">
                      Score Earned
                    </span>
                    <span className="font-mono text-3xl sm:text-4xl font-extrabold text-brand-primary">
                      {result.score} pts
                    </span>
                  </div>
                </div>

                {/* Educational Findings & PCI Standards */}
                <div>
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-brand-muted mb-3">
                    Educational Findings Breakdown:
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
                    {(result.findings || []).map((f, i) => (
                      <div
                        key={i}
                        className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                          f.esCorrecto
                            ? "bg-brand-primary/10 border-brand-primary/30"
                            : "bg-rose-500/15 border-rose-400/35"
                        }`}
                      >
                        <div className="flex items-center justify-between font-extrabold gap-2">
                          <span className="truncate">
                            {f.esCorrecto ? "✅" : "❌"} {f.titulo}
                          </span>
                          <span
                            className={`font-mono shrink-0 ${
                              f.puntos >= 0 ? "text-brand-primary" : "text-rose-300"
                            }`}
                          >
                            {f.puntos >= 0 ? `+${f.puntos}` : f.puntos} pts
                          </span>
                        </div>

                        <p className="text-brand-muted leading-relaxed">
                          {f.explicacion}
                        </p>

                        {f.requisitoPci && (
                          <div className="text-[10px] font-mono text-brand-primary pt-1 border-t border-brand-primary/15">
                            Standard: {f.requisitoPci}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-brand-primary/20">
                  <Link
                    href="/menu"
                    className="btn-interactive h-12 px-5 rounded-xl icx-subcard font-bold text-xs sm:text-sm flex items-center"
                  >
                    ← Return to Menu
                  </Link>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/ranking"
                      className="btn-interactive h-12 px-5 rounded-xl icx-subcard border-brand-primary/40 text-brand-primary font-extrabold text-xs sm:text-sm flex items-center"
                    >
                      🏆 View Leaderboard
                    </Link>
                    {canPlayGame("AUDITOR") && (
                      <button
                        type="button"
                        onClick={handleStartCountdown}
                        className="btn-interactive btn-icx-primary h-12 px-6 rounded-xl font-extrabold text-xs sm:text-sm"
                      >
                        🔄 Play Attempt 2 of 2
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
