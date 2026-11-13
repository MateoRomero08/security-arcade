"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { BRAND_CONFIG } from "@/config/brand";

interface TvLeaderboardItem {
  tag: string;
  name: string;
  area: string;
  total: number;
  auditor: number;
  fraud: number;
}

export default function TvModePage() {
  const [qrUrl, setQrUrl] = useState("");
  const [leaderboard, setLeaderboard] = useState<TvLeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://security-arcade.intouchcx.interno";
    setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data=${encodeURIComponent(origin)}`);

    const fetchLeaderboard = () => {
      fetch("/api/leaderboard")
        .then((r) => r.json())
        .then((data) => {
          setLoading(false);
          if (data?.leaderboard && Array.isArray(data.leaderboard)) {
            setLeaderboard(
              data.leaderboard.map((item: any) => ({
                tag: item.tag ? item.tag.split("·")[0].trim() : item.name,
                name: item.name,
                area: item.area,
                total: item.totalScore || item.total || 0,
                auditor: item.auditorScore || item.auditor || 0,
                fraud: item.fraudScore || item.fraud || 0,
              }))
            );
          }
        })
        .catch(() => {
          setLoading(false);
        });
    };

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#031207] text-white p-6 lg:p-10 flex flex-col justify-between overflow-hidden font-sans">
      {/* TV Header with Logo & Tagline */}
      <header className="flex items-center justify-between pb-6 border-b border-brand-primary/25">
        <div className="flex items-center gap-4">
          <BrandLogo />
          <div className="hidden sm:block h-8 w-px bg-brand-primary/30" />
          <span className="hidden sm:inline-block font-mono text-sm tracking-widest text-brand-primary uppercase font-extrabold">
            {BRAND_CONFIG.eventTagline}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-primary/20 border border-brand-primary text-brand-primary font-mono text-xs font-black tracking-wider animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-primary" />
            LIVE PROJECTION
          </span>
          <Link
            href="/menu"
            className="text-xs text-brand-muted hover:text-white px-3 py-1.5 rounded-xl icx-subcard"
          >
            ✕ Exit
          </Link>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto py-6 items-center">
        {/* Left Column: Top Players */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl lg:text-3xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-emerald-300 to-white">
              🏆 LEADERBOARD STANDINGS
            </h1>
            <span className="font-mono text-xs text-brand-muted">
              Live database updates
            </span>
          </div>

          {loading ? (
            <div className="icx-card rounded-2xl p-12 text-center text-brand-muted font-mono animate-pulse">
              Connecting to live database standings...
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="icx-card rounded-2xl p-10 text-center space-y-3 border-2 border-brand-primary/30">
              <div className="text-4xl">🎮</div>
              <div className="text-xl font-mono font-black text-white">
                NO SCORES RECORDED YET
              </div>
              <p className="text-xs text-brand-muted max-w-md mx-auto">
                Scan the QR code on the right with your phone to jump into the game and claim the #1 spot on the big screen!
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {leaderboard.map((item, idx) => {
                const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
                return (
                  <div
                    key={idx}
                    className="icx-card rounded-2xl px-5 py-3.5 flex items-center justify-between text-base lg:text-lg border-brand-primary/30 transition-transform duration-300 hover:scale-[1.01]"
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-mono font-black text-xl lg:text-2xl text-brand-primary w-8 text-center">
                        {medal}
                      </span>
                      <div>
                        <div className="font-extrabold text-white">{item.tag}</div>
                        <div className="text-xs text-brand-muted font-mono uppercase">
                          {item.area} · Auditor: {item.auditor} | Fraud: {item.fraud}
                        </div>
                      </div>
                    </div>

                    <span className="font-mono font-black text-2xl text-brand-primary">
                      {item.total} pts
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Giant QR */}
        <div className="lg:col-span-5 flex flex-col items-center text-center space-y-6">
          <div className="icx-card rounded-3xl p-8 border-2 border-brand-primary/40 shadow-[0_0_40px_rgba(67,229,104,0.25)] flex flex-col items-center">
            <span className="px-3.5 py-1 rounded-full bg-brand-primary/15 text-brand-primary text-xs font-mono font-black uppercase tracking-widest mb-3">
              SCAN TO PLAY
            </span>

            <div className="bg-white p-4 rounded-3xl shadow-2xl mb-4 border-4 border-brand-primary">
              {qrUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrUrl}
                  alt="QR Security Arcade"
                  className="w-56 h-56 lg:w-64 lg:h-64 block object-contain"
                />
              ) : (
                <div className="w-56 h-56 bg-slate-100 flex items-center justify-center font-mono text-xs text-slate-800 font-bold">
                  Generating QR...
                </div>
              )}
            </div>

            <p className="text-sm font-bold text-white">
              Point your phone camera to jump straight into the game
            </p>
            <p className="text-xs text-brand-muted font-mono mt-1">
              Zero passwords · Instant browser gameplay
            </p>
          </div>

          {/* Recent Players Status */}
          <div className="w-full icx-subcard rounded-2xl p-4 text-left">
            <div className="text-[11px] font-mono uppercase tracking-wider text-brand-muted font-bold mb-2">
              Event Status:
            </div>
            <div className="text-xs text-slate-300">
              {leaderboard.length > 0 ? (
                <span className="text-brand-primary font-mono font-bold">
                  ● {leaderboard.length} active players competing across departments
                </span>
              ) : (
                <span className="text-brand-muted font-mono">
                  Waiting for players to join the arcade shift...
                </span>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="pt-4 border-t border-brand-primary/20 flex items-center justify-between text-xs text-brand-muted font-mono">
        <div>InTouchCX · Information Security & PCI DSS Awareness v4.0.1</div>
        <div className="text-brand-primary">LIVE STANDINGS</div>
      </footer>
    </div>
  );
}
