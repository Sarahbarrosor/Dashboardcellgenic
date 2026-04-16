import { NextResponse } from "next/server";
import { testConnection } from "@/lib/katana";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await testConnection();
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
