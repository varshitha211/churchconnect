import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const rsvps = await prisma.rsvp.findMany({
      where: { eventId: id },
      include: { member: { select: { fullName: true, phone: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: rsvps });
  } catch (error) {
    console.error("List RSVPs error:", error);
    return NextResponse.json({ error: "Failed to fetch RSVPs" }, { status: 500 });
  }
}
