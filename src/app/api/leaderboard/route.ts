import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface LeaderboardItem {
  tag: string;
  name: string;
  area: string;
  auditorScore: number;
  fraudScore: number;
  totalScore: number;
}

const FALLBACK_LEADERBOARD: LeaderboardItem[] = [
  { tag: "Camila R. · S-OPS", name: "Camila Rodriguez", area: "S-OPS", auditorScore: 820, fraudScore: 850, totalScore: 1670 },
  { tag: "Andrew V. · IT", name: "Andrew Vance", area: "IT", auditorScore: 790, fraudScore: 810, totalScore: 1600 },
  { tag: "Valerie M. · EX", name: "Valerie Miller", area: "EX", auditorScore: 740, fraudScore: 760, totalScore: 1500 },
  { tag: "Sebastian D. · LSS", name: "Sebastian Davis", area: "LSS", auditorScore: 680, fraudScore: 720, totalScore: 1400 },
  { tag: "Daniela B. · HR", name: "Daniela Brooks", area: "HR", auditorScore: 650, fraudScore: 690, totalScore: 1340 },
  { tag: "Matthew G. · RECRUITMENT", name: "Matthew Green", area: "RECRUITMENT", auditorScore: 610, fraudScore: 640, totalScore: 1250 },
  { tag: "Carlos P. · FACILITIES", name: "Carlos Perez", area: "FACILITIES", auditorScore: 590, fraudScore: 620, totalScore: 1210 },
];

export async function GET() {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({
      source: "local_seed",
      leaderboard: FALLBACK_LEADERBOARD,
    });
  }

  try {
    // Try fetching from Supabase view v_leaderboard
    const { data, error } = await supabase
      .from("v_leaderboard")
      .select("player_name, short_name, area_name, game_type, score")
      .order("score", { ascending: false })
      .limit(50);

    if (error || !data || data.length === 0) {
      return NextResponse.json({
        source: "local_fallback",
        leaderboard: FALLBACK_LEADERBOARD,
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
      source: "supabase",
      leaderboard: leaderboard.length > 0 ? leaderboard : FALLBACK_LEADERBOARD,
    });
  } catch {
    return NextResponse.json({
      source: "local_fallback",
      leaderboard: FALLBACK_LEADERBOARD,
    });
  }
}
