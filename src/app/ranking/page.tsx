"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArcadeHeader } from "@/components/arcade/ArcadeHeader";
import { usePlayerStore } from "@/stores/playerStore";
import { synth } from "@/lib/audio/synth";

interface RankingEntry {
  tag: string;
  name: string;
  area: string;
  auditorScore: number;
  fraudScore: number;
  totalScore: number;
}

const SEED_RANKINGS: RankingEntry[] = [
  { tag: "Camila R. · S-OPS", name: "Camila Rodriguez", area: "S-OPS", auditorScore: 820, fraudScore: 850, totalScore: 1670 },
  { tag: "Andrew V. · IT", name: "Andrew Vance", area: "IT", auditorScore: 790, fraudScore: 810, totalScore: 1600 },
  { tag: "Valerie M. · EX", name: "Valerie Miller", area: "EX", auditorScore: 740, fraudScore: 760, totalScore: 1500 },
  { tag: "Sebastian D. · LSS", name: "Sebastian Davis", area: "LSS", auditorScore: 680, fraudScore: 720, totalScore: 1400 },
  { tag: "Daniela B. · HR", name: "Daniela Brooks", area: "HR", auditorScore: 650, fraudScore: 690, totalScore: 1340 },
  { tag: "Matthew G. · RECRUITMENT", name: "Matthew Green", area: "RECRUITMENT", auditorScore: 610, fraudScore: 640, totalScore: 1250 },
  { tag: "Carlos P. · FACILITIES", name: "Carlos Perez", area: "FACILITIES", auditorScore: 590, fraudScore: 620, totalScore: 1210 },
];

export default function RankingPage() {
  const player = usePlayerStore((s) => s.player);
  const [activeTab, setActiveTab] = useState<"INDIVIDUAL" | "AREAS" | "GAMES">("INDIVIDUAL");
  const [leaderboard, setLeaderboard] = useState<RankingEntry[]>(SEED_RANKINGS);
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    const currentUrl = typeof window !== "undefined" ? window.location.origin : "https://security-arcade.intouchcx.interno";
    setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(currentUrl)}`);

    // Fetch from Supabase via API route, falling back to seeds
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((data) => {
        if (data?.leaderboard && Array.isArray(data.leaderboard) && data.leaderboard.length > 0) {
          setLeaderboard(data.leaderboard);
        }
      })
      .catch(() => {});

    if (player && (player.bestScoreAuditor > 0 || player.bestScoreFraud > 0)) {
      const myTotal = (player.bestScoreAuditor || 0) + (player.bestScoreFraud || 0);
      setLeaderboard((prev) => {
        const withoutMe = prev.filter((p) => p.name !== player.name);
        const myEntry: RankingEntry = {
          tag: `${player.shortName} · ${player.area}`,
          name: player.name,
          area: player.area,
          auditorScore: player.bestScoreAuditor || 0,
          fraudScore: player.bestScoreFraud || 0,
          totalScore: myTotal,
        };
        return [...withoutMe, myEntry].sort((a, b) => b.totalScore - a.totalScore);
      });
    }
  }, [player]);

  const areaStats = React.useMemo(() => {
    const map: Record<string, number[]> = {};
    leaderboard.forEach((item) => {
      if (!map[item.area]) map[item.area] = [];
      map[item.area].push(item.totalScore);
    });

    const entries = Object.entries(map).map(([area, scores]) => {
      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      return { area, avg, count: scores.length };
    });

    return entries.sort((a, b) => b.avg - a.avg);
  }, [leaderboard]);

  const maxAreaAvg = Math.max(1, areaStats[0]?.avg || 1000);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-brand-bg text-white font-sans">
      <ArcadeHeader showBackToMenu />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 flex flex-col gap-6 animate-fade-slide-up">
        {/* Header */}
        <div className="icx-card rounded-3xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/15 border border-brand-primary/30 text-brand-primary text-xs font-mono font-bold mb-1">
              <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
              LIVE LEADERBOARD
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Security Leaderboard
            </h1>
            <p className="text-xs text-brand-muted">
              Individual standings and department average performance
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#041409] border border-brand-primary/20">
            <button
              onClick={() => { synth.playTap(); setActiveTab("INDIVIDUAL"); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === "INDIVIDUAL"
                  ? "bg-brand-primary text-brand-bg shadow-md"
                  : "text-brand-muted hover:text-white"
              }`}
            >
              Individual
            </button>
            <button
              onClick={() => { synth.playTap(); setActiveTab("AREAS"); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === "AREAS"
                  ? "bg-brand-primary text-brand-bg shadow-md"
                  : "text-brand-muted hover:text-white"
              }`}
            >
              Departments
            </button>
            <button
              onClick={() => { synth.playTap(); setActiveTab("GAMES"); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === "GAMES"
                  ? "bg-brand-primary text-brand-bg shadow-md"
                  : "text-brand-muted hover:text-white"
              }`}
            >
              By Minigame
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Column */}
          <div className="lg:col-span-8 space-y-4">
            {/* TAB 1: INDIVIDUAL */}
            {activeTab === "INDIVIDUAL" && (
              <div className="icx-card rounded-3xl p-5 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-brand-muted px-2 pb-1 border-b border-brand-primary/15">
                  <span>Rank · Player & Department</span>
                  <span>Accumulated Score</span>
                </div>

                {leaderboard.map((entry, index) => {
                  const isTop1 = index === 0;
                  const isTop2 = index === 1;
                  const isTop3 = index === 2;
                  const medal = isTop1 ? "🥇" : isTop2 ? "🥈" : isTop3 ? "🥉" : `#${index + 1}`;
                  const isMe = player && entry.name === player.name;

                  return (
                    <div
                      key={index}
                      className={`px-4 py-3 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm transition-all ${
                        isMe
                          ? "bg-brand-primary/20 border-2 border-brand-primary shadow-[0_0_15px_rgba(67,229,104,0.3)]"
                          : "icx-subcard hover:border-brand-primary/40"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono font-extrabold text-base w-7 text-center shrink-0 text-brand-primary">
                          {medal}
                        </span>
                        <div className="min-w-0">
                          <div className="font-extrabold truncate text-white flex items-center gap-2">
                            <span>{entry.tag}</span>
                            {isMe && (
                              <span className="px-2 py-0.5 rounded-full bg-brand-primary text-brand-bg text-[10px] font-black">
                                YOU
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-brand-muted font-mono">
                            Auditor: {entry.auditorScore} pts · Fraud: {entry.fraudScore} pts
                          </div>
                        </div>
                      </div>

                      <span className="font-mono font-extrabold text-brand-primary text-base sm:text-lg shrink-0">
                        {entry.totalScore} pts
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 2: DEPARTMENTS */}
            {activeTab === "AREAS" && (
              <div className="icx-card rounded-3xl p-5 sm:p-6 space-y-4">
                <div>
                  <h2 className="text-base font-extrabold text-white">
                    Department Challenge (Average Points)
                  </h2>
                  <p className="text-xs text-brand-muted">
                    To maintain fairness across team sizes, standings are based on member score averages.
                  </p>
                </div>

                <div className="space-y-3.5 pt-2">
                  {areaStats.map((item, idx) => {
                    const pct = Math.min(100, Math.round((item.avg / maxAreaAvg) * 100));
                    return (
                      <div key={idx} className="space-y-1.5 icx-subcard p-3.5 rounded-2xl">
                        <div className="flex justify-between items-center text-xs sm:text-sm font-bold">
                          <span className="flex items-center gap-2 text-white">
                            <span className="font-mono font-extrabold text-brand-primary">#{idx + 1}</span>
                            <span>{item.area}</span>
                            <span className="text-[10px] text-brand-muted font-normal font-mono">
                              ({item.count} players)
                            </span>
                          </span>
                          <span className="font-mono text-brand-primary font-extrabold text-sm sm:text-base">
                            {item.avg} pts avg
                          </span>
                        </div>
                        <div className="w-full h-3 bg-[#051B0B] rounded-full overflow-hidden p-0.5 border border-brand-primary/20">
                          <div
                            className="h-full bg-gradient-to-r from-brand-primary to-emerald-400 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: BY MINIGAME */}
            {activeTab === "GAMES" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Top Auditor */}
                <div className="icx-card rounded-3xl p-5 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-brand-primary/20">
                    <span className="text-2xl">🕵️‍♂️</span>
                    <h3 className="font-extrabold text-sm text-white">
                      Top: The Auditor is Coming!
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {[...leaderboard]
                      .sort((a, b) => b.auditorScore - a.auditorScore)
                      .slice(0, 5)
                      .map((row, i) => (
                        <div key={i} className="icx-subcard p-2.5 rounded-xl flex justify-between items-center text-xs">
                          <span className="truncate max-w-[170px] text-white">
                            <strong className="text-brand-primary font-mono mr-1.5">#{i + 1}</strong>
                            {row.tag}
                          </span>
                          <span className="font-mono font-extrabold text-brand-primary">
                            {row.auditorScore} pts
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Top Fraud */}
                <div className="icx-card rounded-3xl p-5 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-brand-primary/20">
                    <span className="text-2xl">🛡️</span>
                    <h3 className="font-extrabold text-sm text-white">
                      Top: Fraud Hunter
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {[...leaderboard]
                      .sort((a, b) => b.fraudScore - a.fraudScore)
                      .slice(0, 5)
                      .map((row, i) => (
                        <div key={i} className="icx-subcard p-2.5 rounded-xl flex justify-between items-center text-xs">
                          <span className="truncate max-w-[170px] text-white">
                            <strong className="text-brand-primary font-mono mr-1.5">#{i + 1}</strong>
                            {row.tag}
                          </span>
                          <span className="font-mono font-extrabold text-brand-primary">
                            {row.fraudScore} pts
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* QR Scan Column */}
          <div className="lg:col-span-4 icx-card rounded-3xl p-6 text-center flex flex-col items-center">
            <span className="px-3 py-1 rounded-full bg-brand-primary/15 text-brand-primary text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
              SCAN TO PLAY
            </span>
            <h2 className="text-lg font-extrabold text-white mb-1">
              Join From Your Phone
            </h2>
            <p className="text-xs text-brand-muted mb-4 max-w-[220px]">
              Scan with your mobile camera to jump straight into the session.
            </p>

            <div className="bg-white p-3.5 rounded-2xl shadow-2xl mb-4 border-2 border-brand-primary/40">
              {qrUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrUrl}
                  alt="QR Security Arcade"
                  className="w-44 h-44 block mx-auto object-contain"
                />
              ) : (
                <div className="w-44 h-44 bg-slate-100 flex items-center justify-center font-mono text-xs text-slate-800 font-bold">
                  Generating QR...
                </div>
              )}
            </div>

            <div className="text-[11px] font-mono text-brand-primary font-bold">
              InTouchCX · Security Arcade
            </div>

            <Link
              href="/tv"
              className="btn-interactive w-full mt-4 h-11 rounded-xl icx-subcard hover:border-brand-primary text-xs font-extrabold flex items-center justify-center gap-2 text-white"
            >
              <span>📺</span>
              <span>Open Big Screen TV Mode</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
