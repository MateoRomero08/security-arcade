"use client";

import React from "react";
import { ClientAuditItem } from "@/types/game";

interface DeskSvgProps {
  items: ClientAuditItem[];
  activeIndex: number;
  onSelectItem: (index: number) => void;
}

// Single emoji icon per svg_key — clean, no dual emojis
const ITEM_ICONS: Record<string, string> = {
  postit_yellow: "🗒️",
  paper_pan: "💳",
  monitor_unlocked: "🖥️",
  smartphone_camera: "📱",
  usb_danger: "🔌",
  person_suspicious: "🕵️",
  pos_broken: "📟",
  keys_metal: "🗝️",
  app_remote: "💻",
  router_rogue: "📡",
  notebook_creds: "📒",
  report_unmasked: "📄",
  email_printout: "✉️",
  voice_recorder: "🎙️",
  thermos_bottle: "🥤",
  headset_corp: "🎧",
  badge_visible: "🪪",
  postit_ext: "📝",
  report_masked: "📋",
  token_mfa: "🔑",
  monitor_locked: "🔒",
  usb_corp: "💾",
  coffee_mug: "☕",
  photo_frame: "🖼️",
  privacy_filter: "🛡️",
  drawer_locked: "🗄️",
  calculator_basic: "🔢",
  notebook_clean: "📓",
  phone_corp: "📞",
  plant_pot: "🪴",
};

// Infraction flag per svg_key to show a subtle warning ring
export const INFRACTION_KEYS = new Set([
  "postit_yellow", "paper_pan", "monitor_unlocked", "smartphone_camera",
  "usb_danger", "person_suspicious", "pos_broken", "keys_metal",
  "app_remote", "router_rogue", "notebook_creds", "report_unmasked",
  "email_printout", "voice_recorder",
]);

export const DeskSvg: React.FC<DeskSvgProps> = ({
  items,
  activeIndex,
  onSelectItem,
}) => {
  return (
    <div className="icx-card rounded-3xl overflow-hidden p-3 sm:p-4 w-full">
      {/* ── Desk scene – pure CSS, no SVG min-width, 100% mobile-safe ── */}
      <div
        className="relative w-full rounded-2xl overflow-hidden select-none"
        style={{
          background: "linear-gradient(180deg, #051B0B 0%, #0B2E15 55%, #031006 100%)",
          paddingBottom: "56%", // 16:9 aspect ratio via padding trick
        }}
      >
        {/* Inner absolute container fills the padding-box */}
        <div className="absolute inset-0 flex flex-col">

          {/* ── Wall area (top 55%) ── */}
          <div className="relative flex-none" style={{ height: "55%" }}>

            {/* Hallway window – left */}
            <div
              className="absolute rounded-xl border border-[#1E522C] bg-[#06200E] flex items-center justify-center"
              style={{ left: "3%", top: "8%", width: "22%", height: "72%" }}
            >
              <span
                className="font-mono font-bold text-[#43E568] opacity-50 text-center leading-tight"
                style={{ fontSize: "clamp(5px, 1.4vw, 9px)" }}
              >
                OPERATIONS<br />HALLWAY
              </span>
            </div>

            {/* Monitor – center */}
            <div
              className="absolute rounded-xl border-4 border-[#2D7A42] bg-[#071F0E] flex items-center justify-center"
              style={{ left: "30%", top: "5%", width: "40%", height: "78%" }}
            >
              <span
                className="font-bold text-[#43E568] opacity-10 text-center"
                style={{ fontSize: "clamp(8px, 2.5vw, 16px)" }}
              >
                InTouchCX
              </span>
            </div>

            {/* Rack / Tower – right */}
            <div
              className="absolute rounded-xl border border-[#1E522C] bg-[#05180B] flex flex-col items-center justify-start pt-2 gap-1.5"
              style={{ right: "2%", top: "5%", width: "16%", height: "80%" }}
            >
              <div className="w-2 h-2 rounded-full bg-[#43E568]" />
              <div className="w-2 h-2 rounded-full bg-[#43E568] opacity-30" />
              <span
                className="font-mono font-bold text-[#A3C6AD] opacity-60 mt-1"
                style={{ fontSize: "clamp(4px, 1.1vw, 7px)" }}
              >
                RACK
              </span>
            </div>
          </div>

          {/* ── Desk surface (bottom 45%) ── */}
          <div
            className="relative flex-1 rounded-b-2xl"
            style={{ background: "linear-gradient(180deg, #133D1F 0%, #092310 100%)", borderTop: "2px solid #286B3A" }}
          >
            {/* Keyboard */}
            <div
              className="absolute rounded bg-[#061A0C] border border-[#286B3A] opacity-70"
              style={{ left: "28%", bottom: "12%", width: "32%", height: "28%" }}
            />
          </div>
        </div>

        {/* ── Interactive Items overlay (absolute, full scene) ── */}
        {items.map((item, idx) => {
          const isSelected = idx === activeIndex && !item.resolved;
          const icon = ITEM_ICONS[item.svg_key] || "🔎";

          // Distribute items across the desk in a 2-row grid pattern
          // Row 1: items 0–3 across top (wall area, like pinned items)
          // Row 2: items 4–7 across bottom (desk surface)
          const col = idx % 4;
          const row = Math.floor(idx / 4);

          const leftPct = row === 0
            ? [5, 27, 52, 74][col]
            : [8, 30, 54, 76][col];
          const topPct = row === 0 ? 10 : 60;

          let containerCls = "transition-transform duration-200 active:scale-90 ";
          let ringCls = "border-2 ";

          if (item.resolved) {
            containerCls += "opacity-40";
            ringCls += "border-[#43E568]/40";
          } else if (isSelected) {
            containerCls += "scale-110 z-20 drop-shadow-[0_0_10px_rgba(67,229,104,0.9)]";
            ringCls += "border-[#43E568] animate-pulse";
          } else {
            containerCls += "hover:scale-105 z-10";
            ringCls += "border-white/20";
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectItem(idx)}
              className={`absolute flex flex-col items-center gap-0.5 cursor-pointer ${containerCls}`}
              style={{
                left: `${leftPct}%`,
                top: `${topPct}%`,
                transform: "translate(-50%, -50%)",
              }}
              aria-label={`Item ${idx + 1}: ${item.nombre}`}
            >
              {/* Badge circle */}
              <div
                className={`rounded-full bg-[#041409]/90 ${ringCls} flex items-center justify-center`}
                style={{ width: "clamp(32px, 8vw, 44px)", height: "clamp(32px, 8vw, 44px)" }}
              >
                <span style={{ fontSize: "clamp(14px, 3.5vw, 20px)" }}>{icon}</span>
              </div>
              {/* Number label */}
              <span
                className="font-mono font-black text-[#43E568] leading-none"
                style={{ fontSize: "clamp(7px, 1.5vw, 10px)" }}
              >
                {item.resolved ? "✔" : `#${idx + 1}`}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Item grid legend (accessibility + quick tap alternative) ── */}
      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {items.map((item, idx) => {
          const isActive = idx === activeIndex && !item.resolved;
          const icon = ITEM_ICONS[item.svg_key] || "🔎";
          return (
            <button
              key={`legend-${item.id}`}
              type="button"
              onClick={() => onSelectItem(idx)}
              className={`rounded-xl p-1.5 flex flex-col items-center gap-0.5 border transition-all duration-150 active:scale-95 ${
                item.resolved
                  ? "bg-[#092612]/50 border-[#43E568]/20 opacity-40"
                  : isActive
                  ? "bg-[#113D1E] border-[#43E568] shadow-[0_0_8px_rgba(67,229,104,0.5)]"
                  : "bg-[#092612]/70 border-white/10 hover:border-[#43E568]/40"
              }`}
            >
              <span style={{ fontSize: "clamp(14px, 3.5vw, 18px)" }}>{icon}</span>
              <span className="font-mono font-bold text-[#43E568] leading-none" style={{ fontSize: "9px" }}>
                {item.resolved ? "✔" : `#${idx + 1}`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DeskSvg;
