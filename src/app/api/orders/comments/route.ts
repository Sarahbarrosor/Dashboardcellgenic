import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, content } = body;

    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "No users found" }, { status: 400 });

    const comment = await prisma.orderComment.create({
      data: {
        orderId,
        userId: user.id,
        content,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Comment creation error:", error);
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}
