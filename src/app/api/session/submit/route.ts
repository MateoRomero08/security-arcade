import { NextRequest, NextResponse } from "next/server";
import { evaluateAuditSession, evaluateFraudSession } from "@/lib/engine/score-calculator";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// Access the shared in-memory store via globalThis (set by start/route.ts)
function getStore(): Map<string, any> {
  return (globalThis as any).__sessionSnapshots || new Map();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, actions, timeLeftSeconds = 0, player } = body;

    const store = getStore();
    const snapshot = store.get(sessionId);
    if (!snapshot) {
      return NextResponse.json(
        { error: "Session not found or expired. Please start a new game." },
        { status: 404 }
      );
    }

    let result: any = null;

    if (snapshot.gameType === "AUDITOR") {
      result = evaluateAuditSession(
        sessionId,
        snapshot.serverItems,
        actions || [],
        timeLeftSeconds
      );
      store.delete(sessionId);
    } else if (snapshot.gameType === "FRAUD") {
      result = evaluateFraudSession(
        sessionId,
        snapshot.serverScenarios,
        actions || [],
        3
      );
      store.delete(sessionId);
    } else {
      return NextResponse.json({ error: "Unknown game type" }, { status: 400 });
    }

    // Persist to Supabase asynchronously if configured
    const supabase = getSupabaseServerClient();
    if (supabase && result) {
      try {
        // Find area ID or use first matching
        let areaId: string | null = null;
        if (player?.area) {
          const { data: areaData } = await supabase
            .from("areas")
            .select("id")
            .eq("name", player.area)
            .maybeSingle();
          areaId = areaData?.id || null;
        }

        // Upsert player record
        let playerId: string | null = null;
        if (player?.name && areaId) {
          const { data: pData } = await supabase
            .from("players")
            .upsert(
              {
                name: player.name,
                short_name: player.shortName || player.name.split(" ")[0],
                area_id: areaId,
                employee_code: player.employeeCode || null,
                consent_accepted: true,
                consent_timestamp: new Date().toISOString(),
              },
              { onConflict: "name" }
            )
            .select("id")
            .maybeSingle();
          playerId = pData?.id || null;
        }

        // Record game session if player found
        if (playerId) {
          await supabase.from("game_sessions").insert({
            player_id: playerId,
            game_type: snapshot.gameType,
            score: result.score,
            accuracy: result.accuracy,
            rank_label: result.rankLabel,
            breakdown: result.breakdown,
            seed: snapshot.seed || 0,
            content_snapshot: result.findings,
            ended_at: new Date().toISOString(),
          });
        }
      } catch (dbErr) {
        // Non-blocking: failure in DB logging does not disrupt gameplay
        console.warn("Supabase session recording skipped:", dbErr);
      }
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Error processing scores" }, { status: 500 });
  }
}

