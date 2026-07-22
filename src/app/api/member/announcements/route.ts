import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const announcements = await prisma.announcement.findMany({
      where: { churchId: session.churchId, isPublished: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: announcements });
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}
