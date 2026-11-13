import { NextRequest, NextResponse } from "next/server";
import { evaluateAuditSession, evaluateFraudSession } from "@/lib/engine/score-calculator";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

    // ─── Real Supabase Database Persistence ────────────────────────────────
    let dbError: string | null = null;
    let dbSaved = false;
    let recordedPlayerId: string | null = null;
    let recordedSessionId: string | null = null;

    try {
      const supabase = getSupabaseServerClient();

      if (player?.name) {
        // 1. Resolve area ID from official areas
        const playerAreaName = player.area || "S-OPS";
        let areaId: string | null = null;

        const { data: areaData, error: areaErr } = await supabase
          .from("areas")
          .select("id, name")
          .ilike("name", playerAreaName.trim())
          .maybeSingle();

        if (areaErr) {
          console.error("[Submit] Error finding area:", areaErr);
        }

        if (areaData?.id) {
          areaId = areaData.id;
        } else {
          // If area is not found, insert it or get fallback
          const { data: createdArea } = await supabase
            .from("areas")
            .insert({ name: playerAreaName, active: true })
            .select("id")
            .maybeSingle();

          areaId = createdArea?.id || null;
        }

        if (!areaId) {
          const { data: anyArea } = await supabase.from("areas").select("id").limit(1).maybeSingle();
          areaId = anyArea?.id || null;
        }

        // 2. Check if player already exists by name
        const { data: existingPlayer, error: pFindErr } = await supabase
          .from("players")
          .select("id")
          .eq("name", player.name)
          .maybeSingle();

        if (pFindErr) {
          console.error("[Submit] Error querying existing player:", pFindErr);
        }

        if (existingPlayer?.id) {
          recordedPlayerId = existingPlayer.id;
          // Update area and details
          const { error: pUpdErr } = await supabase
            .from("players")
            .update({
              short_name: player.shortName || player.name.split(" ")[0],
              area_id: areaId,
              employee_code: player.employeeCode || null,
              active: true,
              updated_at: new Date().toISOString(),
            })
            .eq("id", recordedPlayerId);

          if (pUpdErr) {
            console.error("[Submit] Error updating player:", pUpdErr);
          }
        } else {
          // Insert new player
          const { data: newPlayer, error: pInsErr } = await supabase
            .from("players")
            .insert({
              name: player.name,
              short_name: player.shortName || player.name.split(" ")[0],
              area_id: areaId,
              employee_code: player.employeeCode || null,
              consent_accepted: true,
              consent_timestamp: new Date().toISOString(),
              active: true,
            })
            .select("id")
            .single();

          if (pInsErr) {
            console.error("[Submit] Error creating player in database:", pInsErr);
            dbError = `Player create error: ${pInsErr.message}`;
          } else {
            recordedPlayerId = newPlayer?.id || null;
          }
        }

        // 3. Insert real game session into game_sessions
        if (recordedPlayerId) {
          const sessionPayload = {
            player_id: recordedPlayerId,
            game_type: snapshot.gameType,
            score: result.score,
            accuracy: result.accuracy ?? 0,
            rank_label: result.rankLabel || "Vigilant Agent",
            breakdown: result.breakdown || {},
            seed: snapshot.seed || Math.floor(Math.random() * 1000000),
            content_snapshot: result.findings || [],
            ended_at: new Date().toISOString(),
            is_valid: true,
          };

          const { data: insertedSession, error: sInsErr } = await supabase
            .from("game_sessions")
            .insert(sessionPayload)
            .select("id")
            .single();

          if (sInsErr) {
            console.error("[Submit] Error inserting game_sessions:", sInsErr);
            dbError = `Session insert error: ${sInsErr.message}`;
          } else {
            recordedSessionId = insertedSession?.id || null;
            dbSaved = true;

            // 4. Optionally insert individual session actions
            if (actions && Array.isArray(actions) && actions.length > 0) {
              const actionsPayload = actions.map((act: any) => ({
                session_id: recordedSessionId,
                item_or_scenario_id: act.itemId || "unknown",
                action: act.action || "NONE",
                elapsed_ms: act.elapsedMs || 0,
                is_correct: Boolean(act.isCorrect ?? true),
                points: act.pointsEarned || 0,
                client_timestamp: act.clientTimestamp
                  ? new Date(act.clientTimestamp).toISOString()
                  : new Date().toISOString(),
              }));

              try {
                await supabase.from("session_actions").insert(actionsPayload);
              } catch {
                // non-critical
              }
            }
          }
        }
      }
    } catch (e: any) {
      console.error("[Submit] Database exception:", e);
      dbError = e?.message || "Unknown database error";
    }

    return NextResponse.json({
      ...result,
      dbSaved,
      dbError,
      recordedPlayerId,
      recordedSessionId,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Error processing scores" }, { status: 500 });
  }
}
