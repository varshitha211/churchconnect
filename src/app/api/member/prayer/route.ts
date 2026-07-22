import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const member = await prisma.member.findFirst({ where: { churchId: session.churchId, email: session.email } });
    if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const prayers = await prisma.prayerRequest.findMany({
      where: { memberId: member.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: prayers });
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const member = await prisma.member.findFirst({ where: { churchId: session.churchId, email: session.email } });
    if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const { title, description, isAnonymous } = await request.json();
    if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });
    const prayer = await prisma.prayerRequest.create({
      data: { memberId: member.id, churchId: session.churchId, title, description, isAnonymous: !!isAnonymous },
    });
    return NextResponse.json({ success: true, data: prayer }, { status: 201 });
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}
