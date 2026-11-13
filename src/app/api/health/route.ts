import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();

    const [playersRes, sessionsRes, areasRes] = await Promise.all([
      supabase.from("players").select("*", { count: "exact", head: true }),
      supabase.from("game_sessions").select("*", { count: "exact", head: true }),
      supabase.from("areas").select("*", { count: "exact", head: true }),
    ]);

    const hasError = playersRes.error || sessionsRes.error || areasRes.error;

    if (hasError) {
      return NextResponse.json(
        {
          ok: false,
          supabaseConnected: false,
          error:
            playersRes.error?.message ||
            sessionsRes.error?.message ||
            areasRes.error?.message,
          playersCount: playersRes.count ?? 0,
          sessionsCount: sessionsRes.count ?? 0,
          areasCount: areasRes.count ?? 0,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      supabaseConnected: true,
      playersCount: playersRes.count ?? 0,
      sessionsCount: sessionsRes.count ?? 0,
      areasCount: areasRes.count ?? 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        supabaseConnected: false,
        error: err?.message || "Unknown database connection error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

