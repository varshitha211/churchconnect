import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const sermons = await prisma.sermon.findMany({
      where: { churchId: session.churchId },
      orderBy: { date: "desc" },
      include: { bookmarks: { where: { member: { email: session.email } } } },
    });
    return NextResponse.json({ success: true, data: sermons });
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}
