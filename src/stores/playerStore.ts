import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { synth } from "@/lib/audio/synth";

export const MAX_GAME_ATTEMPTS = 2; // Strict limit: each player can only play each game twice

export interface PlayerData {
  playerId: string;
  name: string;
  shortName: string;
  area: string;
  employeeCode?: string;
  eventId?: string;
  consentAccepted: boolean;
  bestScoreAuditor: number;
  bestScoreFraud: number;
  attemptsAuditor: number; // Max 2
  attemptsFraud: number;   // Max 2
  badges: string[];
}

interface PlayerStoreState {
  player: PlayerData | null;
  isSoundMuted: boolean;
  setPlayer: (player: PlayerData) => void;
  updateScores: (game: "AUDITOR" | "FRAUD", score: number) => void;
  incrementAttempts: (game: "AUDITOR" | "FRAUD") => number;
  canPlayGame: (game: "AUDITOR" | "FRAUD") => boolean;
  addBadge: (badgeId: string) => void;
  clearPlayer: () => void;
  toggleSound: () => void;
}

export const usePlayerStore = create<PlayerStoreState>()(
  persist(
    (set, get) => ({
      player: null,
      isSoundMuted: false,

      setPlayer: (player) => {
        // Ensure attempts are initialized to 0 if not present
        const sanitized: PlayerData = {
          ...player,
          attemptsAuditor: player.attemptsAuditor ?? 0,
          attemptsFraud: player.attemptsFraud ?? 0,
        };
        set({ player: sanitized });
      },

      updateScores: (game, score) => {
        const current = get().player;
        if (!current) return;

        const updated = { ...current };
        if (game === "AUDITOR") {
          updated.bestScoreAuditor = Math.max(updated.bestScoreAuditor || 0, score);
        } else {
          updated.bestScoreFraud = Math.max(updated.bestScoreFraud || 0, score);
        }
        set({ player: updated });
      },

      incrementAttempts: (game) => {
        const current = get().player;
        if (!current) return 0;

        const updated = { ...current };
        if (game === "AUDITOR") {
          updated.attemptsAuditor = (updated.attemptsAuditor || 0) + 1;
          set({ player: updated });
          return updated.attemptsAuditor;
        } else {
          updated.attemptsFraud = (updated.attemptsFraud || 0) + 1;
          set({ player: updated });
          return updated.attemptsFraud;
        }
      },

      canPlayGame: (game) => {
        const current = get().player;
        if (!current) return false;
        const attempts = game === "AUDITOR" ? (current.attemptsAuditor || 0) : (current.attemptsFraud || 0);
        return attempts < MAX_GAME_ATTEMPTS;
      },

      addBadge: (badgeId) => {
        const current = get().player;
        if (!current) return;
        if (!current.badges.includes(badgeId)) {
          set({
            player: {
              ...current,
              badges: [...current.badges, badgeId],
            },
          });
        }
      },

      clearPlayer: () => set({ player: null }),

      toggleSound: () => {
        const nextMuted = synth.toggleMute();
        set({ isSoundMuted: nextMuted });
      },
    }),
    {
      name: "security_arcade_player_storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
