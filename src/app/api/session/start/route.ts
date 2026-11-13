import { NextRequest, NextResponse } from "next/server";
import { generateAuditGameSession, generateFraudGameSession } from "@/lib/engine/game-generator";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// In-memory store for active session snapshots (fallback / local demo)
// Accessed safely across routes via globalThis without exporting at module level
const sessionSnapshots = new Map<string, any>();
(globalThis as any).__sessionSnapshots = (globalThis as any).__sessionSnapshots || sessionSnapshots;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gameType, level = 1, playerArea, recentIds = [] } = body;

    // Generate secure deterministic seed
    const seed = Math.floor(Math.random() * 2147483647);
    const store = (globalThis as any).__sessionSnapshots as Map<string, any>;

    if (gameType === "AUDITOR") {
      const game = generateAuditGameSession({
        seed,
        level,
        totalItems: 8,
        recentItemIds: recentIds,
      });

      // Save server-side snapshot
      store.set(game.sessionId, {
        gameType: "AUDITOR",
        seed,
        level,
        startedAt: Date.now(),
        serverItems: game.serverItems,
      });

      return NextResponse.json({
        sessionId: game.sessionId,
        seed: game.seed,
        level: game.level,
        items: game.clientItems, // Sanitized client items without answer keys
      });
    }

    if (gameType === "FRAUD") {
      const game = generateFraudGameSession({
        seed,
        playerArea,
        totalScenarios: 8,
        recentScenarioIds: recentIds,
      });

      store.set(game.sessionId, {
        gameType: "FRAUD",
        seed,
        startedAt: Date.now(),
        serverScenarios: game.serverScenarios,
      });

      return NextResponse.json({
        sessionId: game.sessionId,
        seed: game.seed,
        scenarios: game.clientScenarios,
      });
    }

    return NextResponse.json({ error: "Unsupported game type" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to start game session" }, { status: 500 });
  }
}
