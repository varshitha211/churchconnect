import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const member = await prisma.member.findFirst({ where: { churchId: session.churchId, email: session.email } });
    if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const notifs = await prisma.userNotification.findMany({
      where: { memberId: member.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ success: true, data: notifs });
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}
