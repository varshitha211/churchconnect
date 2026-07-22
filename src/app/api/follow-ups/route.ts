import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const followUps = await prisma.followUp.findMany({
      where: {
        event: { churchId: session.churchId },
        status: { not: "RESOLVED" },
      },
      include: {
        member: { select: { fullName: true, phone: true } },
        event: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: followUps });
  } catch (error) {
    console.error("Follow-ups error:", error);
    return NextResponse.json({ error: "Failed to fetch follow-ups" }, { status: 500 });
  }
}
