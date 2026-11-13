import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export interface LeaderboardItem {
  tag: string;
  name: string;
  area: string;
  auditorScore: number;
  fraudScore: number;
  totalScore: number;
}

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();

    // Query official v_leaderboard view
    const { data, error } = await supabase
      .from("v_leaderboard")
      .select("player_name, short_name, area_name, game_type, score")
      .order("score", { ascending: false })
      .limit(50);

    if (error) {
      // Fallback query directly from game_sessions + players if view failed
      const { data: directData, error: directErr } = await supabase
        .from("game_sessions")
        .select(`
          score,
          game_type,
          players (
            name,
            short_name,
            areas (
              name
            )
          )
        `)
        .eq("is_valid", true)
        .order("score", { ascending: false })
        .limit(50);

      if (directErr) {
        return NextResponse.json(
          {
            ok: false,
            error: error.message || directErr.message,
            leaderboard: [],
          },
          { status: 500 }
        );
      }

      if (!directData || directData.length === 0) {
        return NextResponse.json({
          ok: true,
          count: 0,
          leaderboard: [],
        });
      }

      const playerMap: Record<string, LeaderboardItem> = {};
      for (const row of directData as any[]) {
        const p = row.players;
        if (!p?.name) continue;
        const areaName = p.areas?.name || "S-OPS";
        const key = p.name;
        if (!playerMap[key]) {
          playerMap[key] = {
            tag: `${p.short_name || p.name} · ${areaName}`,
            name: p.name,
            area: areaName,
            auditorScore: 0,
            fraudScore: 0,
            totalScore: 0,
          };
        }
        if (row.game_type === "AUDITOR") {
          playerMap[key].auditorScore = Math.max(playerMap[key].auditorScore, row.score);
        } else if (row.game_type === "FRAUD") {
          playerMap[key].fraudScore = Math.max(playerMap[key].fraudScore, row.score);
        }
        playerMap[key].totalScore = playerMap[key].auditorScore + playerMap[key].fraudScore;
      }

      const directLeaderboard = Object.values(playerMap).sort((a, b) => b.totalScore - a.totalScore);
      return NextResponse.json({
        ok: true,
        count: directLeaderboard.length,
        leaderboard: directLeaderboard,
      });
    }

    if (!data || data.length === 0) {
      // Table is empty: return 0 players as requested
      return NextResponse.json({
        ok: true,
        count: 0,
        leaderboard: [],
      });
    }

    // Group by player
    const playerMap: Record<string, LeaderboardItem> = {};

    for (const row of data) {
      const key = row.player_name;
      if (!playerMap[key]) {
        playerMap[key] = {
          tag: `${row.short_name} · ${row.area_name}`,
          name: row.player_name,
          area: row.area_name,
          auditorScore: 0,
          fraudScore: 0,
          totalScore: 0,
        };
      }
      if (row.game_type === "AUDITOR") {
        playerMap[key].auditorScore = Math.max(playerMap[key].auditorScore, row.score);
      } else if (row.game_type === "FRAUD") {
        playerMap[key].fraudScore = Math.max(playerMap[key].fraudScore, row.score);
      }
      playerMap[key].totalScore = playerMap[key].auditorScore + playerMap[key].fraudScore;
    }

    const leaderboard = Object.values(playerMap).sort((a, b) => b.totalScore - a.totalScore);

    return NextResponse.json({
      ok: true,
      count: leaderboard.length,
      leaderboard,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Failed to load leaderboard from database",
        leaderboard: [],
      },
      { status: 500 }
    );
  }
}
