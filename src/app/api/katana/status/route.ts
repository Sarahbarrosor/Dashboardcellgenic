import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await prisma.integrationConfig.findUnique({ where: { provider: "katana" } });
    const hasEnvKey = !!process.env.KATANA_API_KEY;

    return NextResponse.json({
      configured: hasEnvKey || !!config?.apiKey,
      hasEnvKey,
      isActive: config?.isActive || false,
      lastSyncAt: config?.lastSyncAt || null,
      baseUrl: config?.baseUrl || process.env.KATANA_BASE_URL || "https://api.katanamrp.com/v1",
    });
  } catch (error) {
    console.error("Katana status error:", error);
    const hasEnvKey = !!process.env.KATANA_API_KEY;
    return NextResponse.json({
      configured: hasEnvKey,
      hasEnvKey,
      isActive: false,
      lastSyncAt: null,
      baseUrl: process.env.KATANA_BASE_URL || "https://api.katanamrp.com/v1",
    });
  }
}
