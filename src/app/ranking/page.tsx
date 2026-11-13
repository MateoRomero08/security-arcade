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

export default function RankingPage() {
  const player = usePlayerStore((s) => s.player);
  const [activeTab, setActiveTab] = useState<"INDIVIDUAL" | "AREAS" | "GAMES">("INDIVIDUAL");
  const [leaderboard, setLeaderboard] = useState<RankingEntry[]>([]);
  const [dbAreas, setDbAreas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    const currentUrl = typeof window !== "undefined" ? window.location.origin : "https://security-arcade.intouchcx.interno";
    setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(currentUrl)}`);

    // Fetch live areas from database
    fetch("/api/areas")
      .then((r) => r.json())
      .then((data) => {
        if (data?.ok && Array.isArray(data.areas)) {
          setDbAreas(data.areas);
        }
      })
      .catch(() => {});

    // Fetch real leaderboard from Supabase via server API
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((data) => {
        setLoading(false);
        if (data?.ok === false && data?.error) {
          setErrorMsg(data.error);
        }
        if (data?.leaderboard && Array.isArray(data.leaderboard)) {
          let list: RankingEntry[] = data.leaderboard;

          // Merge currently logged in local player if they have an active score
          if (player && (player.bestScoreAuditor > 0 || player.bestScoreFraud > 0)) {
            const myTotal = (player.bestScoreAuditor || 0) + (player.bestScoreFraud || 0);
            const withoutMe = list.filter((p) => p.name !== player.name);
            const myEntry: RankingEntry = {
              tag: `${player.shortName} · ${player.area}`,
              name: player.name,
              area: player.area,
              auditorScore: player.bestScoreAuditor || 0,
              fraudScore: player.bestScoreFraud || 0,
              totalScore: myTotal,
            };
            list = [...withoutMe, myEntry].sort((a, b) => b.totalScore - a.totalScore);
          }

          setLeaderboard(list);
        }
      })
      .catch((err) => {
        setLoading(false);
        setErrorMsg(err?.message || "Failed to connect to leaderboard");
      });
  }, [player]);

  const areaStats = React.useMemo(() => {
    const map: Record<string, number[]> = {};
    // Pre-populate with all dynamic areas from Supabase
    dbAreas.forEach((a) => {
      map[a] = [];
    });
    leaderboard.forEach((item) => {
      if (!map[item.area]) map[item.area] = [];
      map[item.area].push(item.totalScore);
    });

    const entries = Object.entries(map).map(([area, scores]) => {
      const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      return { area, avg, count: scores.length };
    });

    return entries.sort((a, b) => b.avg - a.avg || b.count - a.count);
  }, [leaderboard, dbAreas]);

  const maxAreaAvg = Math.max(1, areaStats[0]?.avg || 1000);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-brand-bg text-white font-sans">
      <ArcadeHeader showBackToMenu />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 flex flex-col gap-6 animate-fade-slide-up">
        {/* Header */}
        <div className="icx-card rounded-3xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/15 border border-brand-primary/30 text-brand-primary text-xs font-mono font-bold mb-1">
              <span>🏆</span>
              <span>LIVE STANDINGS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Security Hall of Fame
            </h1>
            <p className="text-xs sm:text-sm text-brand-muted">
              Real-time employee scores & department standings
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/tv"
              className="btn-interactive px-3.5 py-2 rounded-xl bg-brand-primary/15 hover:bg-brand-primary/25 border border-brand-primary/40 text-brand-primary text-xs font-bold flex items-center gap-1.5"
            >
              <span>📺</span>
              <span>TV Projector Mode</span>
            </Link>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-mono">
            ⚠️ Database notice: {errorMsg}
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex rounded-2xl bg-[#041409] p-1.5 border border-brand-primary/20 max-w-md w-full">
          <button
            type="button"
            onClick={() => {
              synth.playTap();
              setActiveTab("INDIVIDUAL");
            }}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
              activeTab === "INDIVIDUAL"
                ? "bg-brand-primary text-brand-bg shadow-[0_0_15px_rgba(67,229,104,0.3)]"
                : "text-brand-muted hover:text-white"
            }`}
          >
            Top Players
          </button>
          <button
            type="button"
            onClick={() => {
              synth.playTap();
              setActiveTab("AREAS");
            }}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
              activeTab === "AREAS"
                ? "bg-brand-primary text-brand-bg shadow-[0_0_15px_rgba(67,229,104,0.3)]"
                : "text-brand-muted hover:text-white"
            }`}
          >
            Departments
          </button>
          <button
            type="button"
            onClick={() => {
              synth.playTap();
              setActiveTab("GAMES");
            }}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
              activeTab === "GAMES"
                ? "bg-brand-primary text-brand-bg shadow-[0_0_15px_rgba(67,229,104,0.3)]"
                : "text-brand-muted hover:text-white"
            }`}
          >
            By Minigame
          </button>
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

                {loading ? (
                  <div className="py-12 text-center text-brand-muted text-xs font-mono animate-pulse">
                    Connecting to Supabase leaderboard...
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="text-4xl">🎮</div>
                    <div className="text-base font-extrabold text-white">No scores recorded yet!</div>
                    <p className="text-xs text-brand-muted max-w-sm mx-auto">
                      Be the first employee to complete a minigame shift and take the #1 spot on the leaderboard.
                    </p>
                    <Link
                      href="/menu"
                      className="btn-interactive inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary text-brand-bg font-extrabold text-xs"
                    >
                      <span>Play Now</span>
                      <span>→</span>
                    </Link>
                  </div>
                ) : (
                  leaderboard.map((entry, index) => {
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
                  })
                )}
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

                {areaStats.length === 0 ? (
                  <div className="py-10 text-center text-brand-muted text-xs">
                    No department scores recorded yet.
                  </div>
                ) : (
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
                )}
              </div>
            )}

            {/* TAB 3: BY MINIGAME */}
            {activeTab === "GAMES" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Top Auditor */}
                <div className="icx-card rounded-3xl p-5 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-brand-primary/20">
                    <span className="text-2xl">🕵️‍♂️</span>
                    <div>
                      <h3 className="font-extrabold text-sm text-white">The Auditor is Coming!</h3>
                      <span className="text-[10px] font-mono text-brand-muted">Clean Desk Challenge</span>
                    </div>
                  </div>

                  {leaderboard.length === 0 ? (
                    <div className="py-6 text-center text-brand-muted text-xs">No entries yet</div>
                  ) : (
                    <div className="space-y-2">
                      {[...leaderboard]
                        .sort((a, b) => b.auditorScore - a.auditorScore)
                        .slice(0, 5)
                        .map((entry, i) => (
                          <div key={i} className="flex justify-between items-center text-xs icx-subcard p-2.5 rounded-xl">
                            <span className="truncate pr-2 font-semibold">
                              <span className="text-brand-primary font-mono mr-1">#{i + 1}</span>
                              {entry.tag}
                            </span>
                            <span className="font-mono font-bold text-brand-primary shrink-0">
                              {entry.auditorScore} pts
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Top Fraud */}
                <div className="icx-card rounded-3xl p-5 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-brand-primary/20">
                    <span className="text-2xl">🛡️</span>
                    <div>
                      <h3 className="font-extrabold text-sm text-white">Fraud Hunter</h3>
                      <span className="text-[10px] font-mono text-brand-muted">Social Engineering</span>
                    </div>
                  </div>

                  {leaderboard.length === 0 ? (
                    <div className="py-6 text-center text-brand-muted text-xs">No entries yet</div>
                  ) : (
                    <div className="space-y-2">
                      {[...leaderboard]
                        .sort((a, b) => b.fraudScore - a.fraudScore)
                        .slice(0, 5)
                        .map((entry, i) => (
                          <div key={i} className="flex justify-between items-center text-xs icx-subcard p-2.5 rounded-xl">
                            <span className="truncate pr-2 font-semibold">
                              <span className="text-brand-primary font-mono mr-1">#{i + 1}</span>
                              {entry.tag}
                            </span>
                            <span className="font-mono font-bold text-brand-primary shrink-0">
                              {entry.fraudScore} pts
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar / QR */}
          <div className="lg:col-span-4 space-y-4">
            <div className="icx-card rounded-3xl p-5 text-center space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-brand-primary font-bold">
                Scan to Join Event
              </span>

              <div className="bg-white p-3 rounded-2xl mx-auto w-fit border-2 border-brand-primary shadow-lg">
                {qrUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrUrl} alt="QR Code" className="w-40 h-40 object-contain block" />
                ) : (
                  <div className="w-40 h-40 bg-slate-100 flex items-center justify-center text-xs text-slate-700 font-mono">
                    Generating QR...
                  </div>
                )}
              </div>

              <p className="text-xs text-brand-muted leading-relaxed">
                Scan with any mobile phone to register your department and play.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
