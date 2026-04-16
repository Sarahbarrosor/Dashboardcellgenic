import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const integrations = await prisma.integrationConfig.findMany();
    return NextResponse.json({ integrations });
  } catch (error) {
    console.error("Settings API error:", error);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, apiKey, apiSecret, baseUrl, isActive, settings } = body;

    const config = await prisma.integrationConfig.upsert({
      where: { provider },
      update: {
        ...(apiKey !== undefined && { apiKey }),
        ...(apiSecret !== undefined && { apiSecret }),
        ...(baseUrl !== undefined && { baseUrl }),
        ...(isActive !== undefined && { isActive }),
        ...(settings !== undefined && { settings: JSON.stringify(settings) }),
      },
      create: {
        provider,
        apiKey,
        apiSecret,
        baseUrl,
        isActive: isActive || false,
        settings: settings ? JSON.stringify(settings) : null,
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
