import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { COMPANY_AREAS } from "@/config/areas";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();

    // Query all active areas directly from the relational database
    const { data, error } = await supabase
      .from("areas")
      .select("id, name, display_order, active")
      .eq("active", true)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("[Areas API] Database query error:", error);
      return NextResponse.json({
        ok: false,
        error: error.message,
        source: "database_error_fallback",
        areas: Array.from(COMPANY_AREAS),
      });
    }

    if (data && data.length > 0) {
      return NextResponse.json({
        ok: true,
        source: "supabase_database",
        count: data.length,
        areas: data.map((a) => a.name.trim()),
        details: data,
      });
    }

    // If the database table is completely empty, provide standard fallback
    return NextResponse.json({
      ok: true,
      source: "empty_fallback",
      count: COMPANY_AREAS.length,
      areas: Array.from(COMPANY_AREAS),
    });
  } catch (err: any) {
    console.error("[Areas API] Exception:", err);
    return NextResponse.json({
      ok: false,
      error: err?.message || "Failed to query areas",
      source: "exception_fallback",
      areas: Array.from(COMPANY_AREAS),
    });
  }
}
