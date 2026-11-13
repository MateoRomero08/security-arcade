"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { ArcadeHeader } from "@/components/arcade/ArcadeHeader";
import { ExitConfirmModal } from "@/components/arcade/ExitConfirmModal";
import { DonkeyFailPopup } from "@/components/arcade/DonkeyFailPopup";
import { ClientPhishingScenario, SessionActionLog, SessionResult } from "@/types/game";
import { usePlayerStore, MAX_GAME_ATTEMPTS } from "@/stores/playerStore";
import { synth } from "@/lib/audio/synth";

type GamePhase = "INSTRUCTIONS" | "PLAYING" | "GAMEOVER" | "SUMMARY";

const CHANNEL_BADGES: Record<string, { label: string; icon: string }> = {
  EMAIL: { label: "EMAIL MESSAGE", icon: "✉️" },
  SMS: { label: "SMS TEXT MESSAGE", icon: "📱" },
  CHAT: { label: "SUPPORT CHAT / CRM", icon: "💬" },
  CALL: { label: "PHONE CALL (VISHING)", icon: "📞" },
  MFA_PUSH: { label: "MFA PUSH NOTIFICATION", icon: "🛡️" },
  WEB: { label: "WEB PORTAL / BROWSER", icon: "🌐" },
  POS_FISICO: { label: "PHYSICAL DESK / POS", icon: "🏪" },
};

export default function FraudHunterPage() {
  const router = useRouter();
  const player = usePlayerStore((s) => s.player);
  const updateScores = usePlayerStore((s) => s.updateScores);
  const incrementAttempts = usePlayerStore((s) => s.incrementAttempts);
  const canPlayGame = usePlayerStore((s) => s.canPlayGame);

  const [phase, setPhase] = useState<GamePhase>("INSTRUCTIONS");
  const [showExitModal, setShowExitModal] = useState(false);
  const [showDonkeyPopup, setShowDonkeyPopup] = useState(false);
  const [donkeyMessage, setDonkeyMessage] = useState("");

  const [sessionId, setSessionId] = useState("");
  const [scenarios, setScenarios] = useState<ClientPhishingScenario[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shields, setShields] = useState(3);
  const [locked, setLocked] = useState(false);

  // Inspection tools
  const [showHeaders, setShowHeaders] = useState(false);
  const [showUrlInspection, setShowUrlInspection] = useState(false);

  const [actionsLog, setActionsLog] = useState<SessionActionLog[]>([]);
  const actionStartTimeRef = useRef<number>(Date.now());
  const [result, setResult] = useState<SessionResult | null>(null);

  useEffect(() => {
    if (!player) {
      router.push("/registro");
    }
  }, [player, router]);

  // Prevent accidental navigation during active shift
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (phase === "PLAYING") {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    const handlePopState = () => {
      if (phase === "PLAYING") {
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

  const attemptsUsed = player?.attemptsFraud || 0;
  const canPlayThisGame = canPlayGame("FRAUD");

  const handleStartGame = async () => {
    if (!canPlayGame("FRAUD")) return;

    incrementAttempts("FRAUD");
    synth.playCoin();
    setResult(null);

    try {
      const res = await fetch("/api/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameType: "FRAUD",
          playerArea: player?.area || "S-OPS",
        }),
      });
      const data = await res.json();
      if (data.scenarios) {
        setSessionId(data.sessionId);
        setScenarios(data.scenarios);
      }
    } catch {
      // Graceful offline fallback
    }

    setPhase("PLAYING");
    setCurrentIndex(0);
    setShields(3);
    setLocked(false);
    setActionsLog([]);
    setShowHeaders(false);
    setShowUrlInspection(false);
    actionStartTimeRef.current = Date.now();
  };

  const handleDecision = async (markedAsInfraction: boolean) => {
    if (locked || !scenarios[currentIndex]) return;
    setLocked(true);

    const currentScenario = scenarios[currentIndex];
    const chosenAction = markedAsInfraction ? "REPORTAR_FRAUDE" : "RESPONDER_PERMITIDO";
    const elapsedMs = Date.now() - actionStartTimeRef.current;

    // ── Shield mechanic: decrement when player falls for a fraud attack ──────
    // Wrong = scenario IS fraud but player clicked "Legitimate / Trusted"
    const isFraud = currentScenario.es_fraude;
    const fellForFraud = isFraud && !markedAsInfraction;

    let newShields = shields;

    if (fellForFraud) {
      newShields = Math.max(0, shields - 1);
      setShields(newShields);
      synth.playShieldBreak();
      setDonkeyMessage("I-AAAH! 🐴 You fell for a phishing trap! Shield lost!");
      setShowDonkeyPopup(true);
    } else if (!markedAsInfraction && currentScenario.headers_simulados?.spf === "FAIL") {
      // Also trigger donkey if SPF fails but not already handled above
      synth.playDonkeyBray();
      setDonkeyMessage("I-AAAH! 🐴 SPF Check FAILED! That was phishing!");
      setShowDonkeyPopup(true);
    } else {
      synth.playTap();
    }

    const log: SessionActionLog = {
      itemId: currentScenario.id,
      action: chosenAction,
      clientTimestamp: Date.now(),
      elapsedMs,
    };

    const newLogs = [...actionsLog, log];
    setActionsLog(newLogs);

    // ── If shields hit zero → Game Over ──────────────────────────────────────
    if (fellForFraud && newShields === 0) {
      // Submit what we have, then switch to GAMEOVER
      setTimeout(async () => {
        setShowHeaders(false);
        setShowUrlInspection(false);
        await finishGame(newLogs, false);
        setPhase("GAMEOVER");
      }, 500);
      return;
    }

    setTimeout(() => {
      setShowHeaders(false);
      setShowUrlInspection(false);

      if (currentIndex < scenarios.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setLocked(false);
        actionStartTimeRef.current = Date.now();
      } else {
        finishGame(newLogs, true);
      }
    }, 380);
  };

  const finishGame = async (finalLogs: SessionActionLog[], autoShowSummary = true) => {
    try {
      const res = await fetch("/api/session/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          actions: finalLogs,
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

      const data: SessionResult & { dbError?: string } = await res.json();
      if (!data || !Array.isArray(data.findings)) {
        throw new Error("Invalid response format");
      }
      if (data.dbError) {
        console.error("⚠️ [Supabase DB Error]", data.dbError);
      }

      setResult(data);
      updateScores("FRAUD", data.score);

      if (data.score >= 500) {
        confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } });
        synth.playVictory();
      } else if (data.score < 250) {
        synth.playDonkeyBray();
      }

      if (autoShowSummary) {
        setPhase("SUMMARY");
      }
    } catch {
      // Graceful offline evaluation — app never crashes
      const fallbackResult: SessionResult = {
        sessionId: sessionId || "offline_fraud",
        gameType: "FRAUD",
        score: finalLogs.length * 60,
        rankLabel: "Vigilant Trainee",
        correctCount: finalLogs.length,
        totalCount: scenarios.length || 8,
        accuracy: scenarios.length > 0 ? finalLogs.length / scenarios.length : 0,
        breakdown: {
          basePoints: finalLogs.length * 60,
          comboBonus: 0,
          timeBonus: 0,
          perfectBonus: 0,
          penalties: 0,
        },
        findings: scenarios.map((sc) => {
          const act = finalLogs.find((l) => l.itemId === sc.id);
          return {
            itemId: sc.id,
            titulo: `${sc.canal} · ${sc.asunto}`,
            decisionTomada: act?.action === "REPORTAR_FRAUDE" ? "Reported as Fraud" : "Allowed as Legitimate",
            accionCorrecta: "Verify & Classify",
            esCorrecto: !!act,
            puntos: act ? 60 : -50,
            explicacion: sc.cuerpo || "Communication evaluation completed.",
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
    if (phase === "PLAYING") {
      setShowExitModal(true);
    } else {
      router.push("/menu");
    }
  };

  const currentCase = scenarios[currentIndex];
  const channelInfo = currentCase ? CHANNEL_BADGES[currentCase.canal] || { label: currentCase.canal, icon: "🛡️" } : null;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-brand-bg text-white font-sans">
      <ArcadeHeader showBackToMenu onBackToMenu={handleHeaderBack} />

      {/* Confirmation Modal against Accidental Exit */}
      <ExitConfirmModal
        isOpen={showExitModal}
        onCancel={() => setShowExitModal(false)}
        onConfirm={() => {
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

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-4 flex flex-col justify-center">
        {/* ============================================================== */}
        {/* CHECK 2-ATTEMPT LIMIT                                          */}
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
                You have already completed your 2 permitted rounds for the Fraud Hunter simulator.
                Your best score of{" "}
                <strong className="text-brand-primary">
                  {player?.bestScoreFraud || 0} pts
                </strong>{" "}
                is locked on the leaderboard.
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
            {/* PHASE 1: INSTRUCTIONS                                          */}
            {/* ============================================================== */}
            {phase === "INSTRUCTIONS" && (
              <div className="icx-card rounded-3xl p-6 sm:p-8 max-w-xl mx-auto w-full space-y-6 animate-fade-slide-up">
                <div className="flex items-center gap-4 border-b border-brand-primary/20 pb-5">
                  <span className="w-16 h-16 rounded-2xl bg-brand-primary/15 border border-brand-primary/30 flex items-center justify-center text-4xl shrink-0">
                    🛡️
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-primary/15 text-brand-primary">
                        MODE 2 · SOCIAL ENGINEERING
                      </span>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300">
                        Attempt {attemptsUsed + 1} of {MAX_GAME_ATTEMPTS}
                      </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
                      Fraud Hunter
                    </h1>
                    <p className="text-xs text-brand-muted">
                      Defend your 3 shields across incoming communications
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3.5 icx-subcard p-3.5 rounded-2xl">
                    <span className="w-7 h-7 rounded-full bg-brand-primary/20 flex items-center justify-center font-mono font-extrabold text-brand-primary text-xs shrink-0">
                      1
                    </span>
                    <p className="text-xs sm:text-sm text-slate-200">
                      <strong className="text-white">Active shift incoming:</strong> You will review 8 communications (emails, SMS messages, phone calls, and push alerts). Some are genuine work requests, while others are phishing attacks.
                    </p>
                  </div>

                  <div className="flex items-start gap-3.5 icx-subcard p-3.5 rounded-2xl">
                    <span className="w-7 h-7 rounded-full bg-brand-primary/20 flex items-center justify-center font-mono font-extrabold text-brand-primary text-xs shrink-0">
                      2
                    </span>
                    <p className="text-xs sm:text-sm text-slate-200">
                      <strong className="text-white">Inspect technical clues:</strong> Tap to view technical SPF/DKIM headers, sender addresses, and domain indicators before making a decision.
                    </p>
                  </div>

                  <div className="flex items-start gap-3.5 icx-subcard p-3.5 rounded-2xl">
                    <span className="w-7 h-7 rounded-full bg-brand-primary/20 flex items-center justify-center font-mono font-extrabold text-brand-primary text-xs shrink-0">
                      3
                    </span>
                    <p className="text-xs sm:text-sm text-slate-200">
                      <strong className="text-white">Protect your shields:</strong> Falling for a fraudulent trap costs 1 shield. Lose all 3 and it is Game Over! Maximum 2 attempts per registered employee.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStartGame}
                  className="btn-interactive btn-icx-primary w-full h-14 rounded-2xl font-extrabold text-base tracking-wide flex items-center justify-center gap-2 mt-4"
                >
                  <span>START ATTEMPT {attemptsUsed + 1} OF 2</span>
                  <span>→</span>
                </button>
              </div>
            )}

            {/* ============================================================== */}
            {/* PHASE 2: INBOX VIEW                                            */}
            {/* ============================================================== */}
            {phase === "PLAYING" && currentCase && (
              <div className="flex flex-col gap-4 w-full animate-fade-slide-up">
                {/* Top HUD */}
                <div className="icx-card rounded-2xl p-3 sm:px-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="icx-subcard px-3.5 py-1.5 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-brand-muted block">
                        Shields
                      </span>
                      <span className="text-base tracking-widest">
                        {"🛡️".repeat(shields) + "🖤".repeat(3 - shields)}
                      </span>
                    </div>
                    <div className="icx-subcard px-3.5 py-1.5 rounded-xl text-center">
                      <span className="text-[10px] uppercase font-bold text-brand-muted block">
                        Message
                      </span>
                      <span className="font-mono text-base font-extrabold text-white">
                        {currentIndex + 1} / {scenarios.length}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="icx-subcard px-3.5 py-1.5 rounded-xl text-center">
                      <span className="text-[10px] uppercase font-bold text-brand-muted block">
                        Difficulty
                      </span>
                      <span className="font-mono text-xs font-extrabold text-brand-primary">
                        Level {currentCase.dificultad}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Message Card */}
                <div className="icx-card rounded-3xl p-5 sm:p-7 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-brand-primary/15">
                    <span className="px-3 py-1 rounded-full bg-brand-primary/15 text-brand-primary font-mono text-xs font-extrabold flex items-center gap-1.5">
                      <span>{channelInfo?.icon}</span>
                      <span>{channelInfo?.label}</span>
                    </span>

                    <div className="flex items-center gap-2">
                      {currentCase.headers_simulados && (
                        <button
                          type="button"
                          onClick={() => setShowHeaders(!showHeaders)}
                          className="btn-interactive text-[11px] font-mono px-2.5 py-1 rounded-lg icx-subcard hover:border-brand-primary text-brand-muted hover:text-white"
                        >
                          {showHeaders ? "✕ Hide Headers" : "🔍 View SPF Headers"}
                        </button>
                      )}
                      {currentCase.pista_inspeccion && (
                        <button
                          type="button"
                          onClick={() => setShowUrlInspection(!showUrlInspection)}
                          className="btn-interactive text-[11px] font-mono px-2.5 py-1 rounded-lg icx-subcard hover:border-brand-primary text-brand-primary"
                        >
                          {showUrlInspection ? "✕ Hide Clue" : "💡 Technical Clue"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sender Details */}
                  <div className="icx-subcard rounded-2xl p-3.5 space-y-1.5 text-xs sm:text-sm">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5">
                      <span className="text-brand-muted font-semibold">From / Origin:</span>
                      <span className="font-mono font-bold text-brand-primary break-all">
                        {currentCase.remitente}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5">
                      <span className="text-brand-muted font-semibold">Subject / Context:</span>
                      <span className="font-bold text-white">
                        {currentCase.asunto}
                      </span>
                    </div>
                  </div>

                  {/* Simulated Headers */}
                  {showHeaders && currentCase.headers_simulados && (
                    <div className="rounded-xl bg-[#031006] border border-brand-primary/30 p-3 font-mono text-[11px] space-y-1 text-slate-300">
                      <div className="text-brand-primary font-bold">--- SIMULATED MAIL HEADERS ---</div>
                      <div>From Real: <span className="text-amber-400">{currentCase.headers_simulados.from_real}</span></div>
                      <div>SPF Validation: <span className={currentCase.headers_simulados.spf === "PASS" ? "text-brand-primary" : "text-rose-400 font-bold"}>{currentCase.headers_simulados.spf}</span></div>
                      <div>DKIM Signature: <span className={currentCase.headers_simulados.dkim === "PASS" ? "text-brand-primary" : "text-rose-400 font-bold"}>{currentCase.headers_simulados.dkim}</span></div>
                    </div>
                  )}

                  {/* Clue Dropdown */}
                  {showUrlInspection && currentCase.pista_inspeccion && (
                    <div className="rounded-xl bg-brand-primary/10 border border-brand-primary/30 p-3 text-xs text-brand-muted">
                      <strong className="text-brand-primary">💡 Technical clue: </strong>
                      {currentCase.pista_inspeccion}
                    </div>
                  )}

                  {/* Message Body */}
                  <div className="rounded-2xl bg-[#041409]/95 border border-brand-primary/20 p-4 sm:p-5 text-sm sm:text-base leading-relaxed text-slate-100 min-h-[90px]">
                    <p>{currentCase.cuerpo}</p>
                  </div>

                  {/* 2 Decision Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      disabled={locked}
                      onClick={() => handleDecision(false)}
                      className="btn-interactive btn-fraud-legit h-[72px] rounded-2xl px-4 flex items-center justify-center gap-3"
                    >
                      <div className="flex flex-col items-center w-10 shrink-0">
                        <span className="text-2xl leading-none">🛡️</span>
                        <span className="text-xs font-black leading-none mt-0.5">✅</span>
                      </div>
                      <div className="text-left">
                        <div className="text-base font-black leading-tight">LEGITIMATE / TRUSTED</div>
                        <div className="text-[11px] font-semibold opacity-90">Verified safe — legitimate request</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      disabled={locked}
                      onClick={() => handleDecision(true)}
                      className="btn-interactive btn-fraud-danger h-[72px] rounded-2xl px-4 flex items-center justify-center gap-3"
                    >
                      <div className="flex flex-col items-center w-10 shrink-0">
                        <span className="text-2xl leading-none">🚨</span>
                        <span className="text-xs font-black leading-none mt-0.5">⚡</span>
                      </div>
                      <div className="text-left">
                        <div className="text-base font-black leading-tight">FRAUD / PHISHING</div>
                        <div className="text-[11px] font-semibold opacity-90">Report attack — do not engage</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* PHASE 3: GAME OVER — All shields lost                          */}
            {/* ============================================================== */}
            {phase === "GAMEOVER" && (
              <div className="icx-card rounded-3xl p-6 sm:p-8 max-w-md mx-auto w-full text-center space-y-6 animate-fade-slide-up border-2 border-rose-500/50">
                {/* Icon */}
                <div className="w-20 h-20 rounded-3xl bg-rose-500/15 border-2 border-rose-400/40 flex items-center justify-center text-5xl mx-auto shadow-[0_0_30px_rgba(239,68,68,0.25)]">
                  💀
                </div>

                {/* Badge */}
                <div className="space-y-2">
                  <span className="inline-block text-[11px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-rose-500/20 text-rose-300">
                    GAME OVER · ALL SHIELDS DOWN
                  </span>
                  <h1 className="text-3xl font-black text-white">
                    Shields Depleted!
                  </h1>
                  <p className="text-sm text-brand-muted leading-relaxed max-w-xs mx-auto">
                    The attackers broke through your defenses. You fell for too many phishing traps — all 3 shields were lost.
                  </p>
                  <div className="text-2xl tracking-widest pt-1">
                    🖤🖤🖤
                  </div>
                </div>

                {/* Score if available */}
                {result && (
                  <div className="icx-subcard rounded-2xl px-5 py-3 text-center">
                    <span className="text-[10px] font-mono uppercase text-brand-muted block mb-1">Score Recorded</span>
                    <span className="font-mono text-2xl font-extrabold text-rose-400">{result.score} pts</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-3 pt-2">
                  {canPlayGame("FRAUD") && (
                    <button
                      type="button"
                      onClick={handleStartGame}
                      className="btn-interactive btn-icx-primary w-full h-13 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2"
                    >
                      <span>🔄</span>
                      <span>RETRY — ATTEMPT 2 OF 2</span>
                    </button>
                  )}
                  {result && (
                    <button
                      type="button"
                      onClick={() => setPhase("SUMMARY")}
                      className="btn-interactive h-12 rounded-xl icx-subcard border-brand-primary/40 text-brand-primary font-extrabold text-sm flex items-center justify-center gap-2 w-full"
                    >
                      <span>📋</span>
                      <span>View Incident Report</span>
                    </button>
                  )}
                  <Link
                    href="/menu"
                    className="btn-interactive h-12 rounded-xl icx-subcard text-sm font-bold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 w-full"
                  >
                    <span>←</span>
                    <span>Return to Menu</span>
                  </Link>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* PHASE 4: INCIDENT REPORT (SUMMARY)                             */}
            {/* ============================================================== */}
            {phase === "SUMMARY" && result && (
              <div className="icx-card rounded-3xl p-6 sm:p-8 max-w-4xl mx-auto w-full space-y-6 animate-fade-slide-up">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-brand-primary/20">
                  <div className="flex items-center gap-4">
                    <span className="w-16 h-16 rounded-2xl bg-brand-primary/15 border border-brand-primary/30 flex items-center justify-center text-4xl shrink-0">
                      {result.score >= 500 ? "🏆" : "🛡️"}
                    </span>
                    <div>
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-brand-primary/20 text-brand-primary mb-1">
                        {result.rankLabel}
                      </span>
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                        Incident Findings Report
                      </h1>
                      <p className="text-xs sm:text-sm text-brand-muted mt-0.5">
                        Evaluated {result.totalCount} shift communications and correctly resolved {result.correctCount}.
                      </p>
                    </div>
                  </div>

                  <div className="icx-subcard rounded-2xl px-6 py-4 text-center self-stretch sm:self-auto flex flex-col justify-center">
                    <span className="text-[10px] font-mono uppercase text-brand-muted">
                      Total Score
                    </span>
                    <span className="font-mono text-3xl sm:text-4xl font-extrabold text-brand-primary">
                      {result.score} pts
                    </span>
                  </div>
                </div>

                {/* Findings breakdown */}
                <div>
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-brand-muted mb-3">
                    Communications Breakdown:
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

                {/* Post Game Actions */}
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
                    {canPlayGame("FRAUD") && (
                      <button
                        type="button"
                        onClick={handleStartGame}
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
