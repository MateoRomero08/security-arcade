"use client";

import React from "react";

interface ExitConfirmModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({
  isOpen,
  onCancel,
  onConfirm,
  title = "Leave Game in Progress?",
  description = "Your current streak, score, and active shift progress will be lost if you return to the menu now.",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-slide-up">
      <div className="icx-card rounded-3xl p-6 sm:p-7 max-w-sm w-full text-center space-y-5 border-2 border-brand-warning/40 shadow-[0_0_40px_rgba(251,191,36,0.25)]">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-3xl mx-auto">
          ⚠️
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-white leading-tight">
            {title}
          </h2>
          <p className="text-xs text-brand-muted leading-relaxed">
            {description}
          </p>
        </div>

        <div className="flex flex-col gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="btn-interactive btn-icx-primary h-12 rounded-xl font-black text-sm tracking-wide"
          >
            STAY & KEEP PLAYING
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="btn-interactive h-11 rounded-xl icx-subcard hover:border-rose-400/50 text-xs font-bold text-rose-300 hover:text-white"
          >
            Quit to Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExitConfirmModal;

