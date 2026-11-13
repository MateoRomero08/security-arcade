"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArcadeHeader } from "@/components/arcade/ArcadeHeader";
import { MascotAuditor } from "@/components/arcade/MascotAuditor";
import { usePlayerStore } from "@/stores/playerStore";
import { synth } from "@/lib/audio/synth";
import { COMPANY_AREAS } from "@/config/areas";

const DEFAULT_CONSENT_TEXT =
  "I consent to participating in the InTouchCX Fraud Awareness Week Campaign and understand that my nickname and aggregated score will be displayed on the internal company leaderboard.";

export default function RegistroPage() {
  const router = useRouter();
  const setPlayer = usePlayerStore((s) => s.setPlayer);

  const [name, setName] = useState("");
  const [areas, setAreas] = useState<string[]>(Array.from(COMPANY_AREAS));
  const [area, setArea] = useState<string>(COMPANY_AREAS[0] || "S-OPS");
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [employeeCode, setEmployeeCode] = useState("");
  const [consent, setConsent] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch areas dynamically from Supabase database
  useEffect(() => {
    fetch("/api/areas")
      .then((r) => r.json())
      .then((data) => {
        if (data?.ok && Array.isArray(data.areas) && data.areas.length > 0) {
          setAreas(data.areas);
          // Auto-select first area or preserve current if still valid
          setArea((prev) => (data.areas.includes(prev) ? prev : data.areas[0]));
        }
      })
      .catch((err) => {
        console.warn("[Registro] Failed to fetch live areas from database:", err);
      })
      .finally(() => {
        setLoadingAreas(false);
      });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();

    if (!cleanName || cleanName.length < 3) {
      setError("Please enter your full name (at least 3 characters).");
      synth.playError();
      return;
    }
    if (!consent) {
      setError("You must accept the training consent checkbox to proceed.");
      synth.playError();
      return;
    }

    setError(null);
    completeRegistration(cleanName, area, employeeCode);
  };

  const completeRegistration = async (fullName: string, playerArea: string, code?: string) => {
    setIsSubmitting(true);
    synth.playCoin();
    const parts = fullName.trim().split(/\s+/);
    const shortName =
      parts.length > 1
        ? `${parts[0]} ${parts[1][0].toUpperCase()}.`
        : parts[0];

    let registeredId = "p_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();

    try {
      const res = await fetch("/api/player/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          shortName,
          area: playerArea,
          employeeCode: code || undefined,
        }),
      });
      const data = await res.json();
      if (data?.ok && data?.player?.id) {
        registeredId = data.player.id;
      }
    } catch (e) {
      console.warn("Offline registration fallback:", e);
    }

    setPlayer({
      playerId: registeredId,
      name: fullName,
      shortName,
      area: playerArea,
      employeeCode: code || undefined,
      consentAccepted: true,
      bestScoreAuditor: 0,
      bestScoreFraud: 0,
      attemptsAuditor: 0,
      attemptsFraud: 0,
      badges: [],
    });

    router.push("/menu");
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-brand-bg text-white font-sans">
      <ArcadeHeader />

      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-6 flex flex-col justify-center">
        <div className="icx-card rounded-3xl p-6 sm:p-8 animate-fade-slide-up">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <MascotAuditor mood="happy" size={54} />
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                Join Security Arcade
              </h1>
              <p className="text-xs text-brand-muted">
                Score points for your department leaderboard
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-500/20 border border-rose-400 text-rose-200 text-xs font-bold flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-muted mb-1.5">
                Full Name <span className="text-brand-primary">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                placeholder="Enter your name and surname"
                className="w-full h-12 px-4 rounded-xl bg-[#051B0B]/90 border border-brand-primary/30 text-white placeholder-brand-muted/40 text-sm font-semibold focus:outline-none focus:border-brand-primary transition"
                autoComplete="name"
              />
            </div>

            {/* Department (Live from Supabase) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-muted">
                  Company Department / Area <span className="text-brand-primary">*</span>
                </label>
                <span className="text-[10px] font-mono text-brand-primary">
                  {loadingAreas ? "Loading areas..." : `${areas.length} areas available`}
                </span>
              </div>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-[#051B0B]/90 border border-brand-primary/30 text-white text-sm font-semibold focus:outline-none focus:border-brand-primary transition cursor-pointer"
              >
                {areas.map((a) => (
                  <option key={a} value={a} className="bg-[#051B0B] text-white">
                    {a}
                  </option>
                ))}
              </select>
            </div>

            {/* Employee ID (Optional) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-muted mb-1.5">
                Employee Code <span className="text-[10px] text-brand-muted/60">(Optional)</span>
              </label>
              <input
                type="text"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                maxLength={20}
                placeholder="e.g. EMP-8492"
                className="w-full h-12 px-4 rounded-xl bg-[#051B0B]/90 border border-brand-primary/30 text-white placeholder-brand-muted/40 text-sm font-semibold focus:outline-none focus:border-brand-primary transition font-mono"
              />
            </div>

            {/* Checkbox */}
            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-[#051B0B]/60 border border-brand-primary/15 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#43E568] rounded shrink-0 cursor-pointer"
              />
              <span className="text-[11px] text-brand-muted leading-relaxed">
                {DEFAULT_CONSENT_TEXT}
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-interactive btn-icx-primary w-full h-14 rounded-2xl font-extrabold text-base tracking-wide flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
            >
              <span>{isSubmitting ? "REGISTERING..." : "START PLAYING"}</span>
              <span className="text-lg">→</span>
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-brand-primary/15 text-center">
            <Link
              href="/"
              className="text-xs text-brand-muted hover:text-white transition-colors"
            >
              ← Back to Start Screen
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
