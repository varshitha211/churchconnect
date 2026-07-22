import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const updated = await prisma.followUp.update({
      where: { id },
      data: {
        status: body.status,
        notes: body.notes || undefined,
        contactedBy: body.status === "CONTACTED" ? session.userId : undefined,
        contactedAt: body.status === "CONTACTED" ? new Date() : undefined,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update follow-up error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
