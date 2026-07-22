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
    const readings = await prisma.bibleReading.findMany({
      where: { memberId: member.id },
      orderBy: { date: "desc" },
      take: 30,
    });
    return NextResponse.json({ success: true, data: readings });
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const member = await prisma.member.findFirst({ where: { churchId: session.churchId, email: session.email } });
    if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const { book, chapter, verses, notes } = await request.json();
    if (!book || !chapter) return NextResponse.json({ error: "Book and chapter required" }, { status: 400 });
    const today = new Date(); today.setHours(0,0,0,0);
    const existing = await prisma.bibleReading.findFirst({ where: { memberId: member.id, date: today } });
    let reading;
    if (existing) {
      reading = await prisma.bibleReading.update({ where: { id: existing.id }, data: { book, chapter, verses, notes } });
    } else {
      reading = await prisma.bibleReading.create({ data: { memberId: member.id, date: today, book, chapter, verses, notes } });
    }
    return NextResponse.json({ success: true, data: reading }, { status: 201 });
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}
