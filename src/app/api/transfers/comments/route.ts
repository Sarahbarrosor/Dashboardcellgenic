import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transferId, content, userId } = body;

    const user = userId
      ? await prisma.user.findUnique({ where: { id: userId } })
      : await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "No user found" }, { status: 400 });

    const comment = await prisma.transferComment.create({
      data: { transferId, userId: user.id, content },
      include: { user: { select: { id: true, name: true } } },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Transfer comment error:", error);
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}
