import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, shortName, area, employeeCode } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ ok: false, error: "Name is required" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    // Resolve Area
    const targetArea = area || "S-OPS";
    let areaId: string | null = null;

    const { data: areaData } = await supabase
      .from("areas")
      .select("id, name")
      .ilike("name", targetArea.trim())
      .maybeSingle();

    if (areaData?.id) {
      areaId = areaData.id;
    } else {
      const { data: newArea } = await supabase
        .from("areas")
        .insert({ name: targetArea, active: true })
        .select("id")
        .maybeSingle();
      areaId = newArea?.id || null;
    }

    if (!areaId) {
      const { data: fallbackArea } = await supabase.from("areas").select("id").limit(1).maybeSingle();
      areaId = fallbackArea?.id || null;
    }

    // Check if player already exists by name
    const { data: existingPlayer } = await supabase
      .from("players")
      .select("id, name, short_name, area_id")
      .eq("name", name.trim())
      .maybeSingle();

    if (existingPlayer?.id) {
      // Update details
      const { data: updated, error: uErr } = await supabase
        .from("players")
        .update({
          short_name: shortName || name.trim().split(" ")[0],
          area_id: areaId,
          employee_code: employeeCode || null,
          active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingPlayer.id)
        .select()
        .single();

      if (uErr) {
        return NextResponse.json({ ok: false, error: uErr.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true, player: updated });
    }

    // Create new player
    const { data: created, error: cErr } = await supabase
      .from("players")
      .insert({
        name: name.trim(),
        short_name: shortName || name.trim().split(" ")[0],
        area_id: areaId,
        employee_code: employeeCode || null,
        consent_accepted: true,
        consent_timestamp: new Date().toISOString(),
        active: true,
      })
      .select()
      .single();

    if (cErr) {
      return NextResponse.json({ ok: false, error: cErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, player: created });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Registration failed" }, { status: 500 });
  }
}

