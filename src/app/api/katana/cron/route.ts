import { NextRequest, NextResponse } from "next/server";
import { fullSync } from "@/lib/katana";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.KATANA_API_KEY) {
    return NextResponse.json({ ok: false, skipped: true, reason: "No KATANA_API_KEY configured" });
  }

  try {
    const result = await fullSync("cron");
    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error("Cron sync error:", error);
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
