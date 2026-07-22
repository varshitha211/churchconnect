import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const sermons = await prisma.sermon.findMany({
      orderBy: { date: "desc" },
      include: { _count: { select: { bookmarks: true } } },
    });
    return NextResponse.json({ success: true, data: sermons });
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await request.json();
    const { title, speaker, date, description, videoUrl, audioUrl, notesPdf, duration } = body;
    if (!title || !speaker || !date) {
      return NextResponse.json({ error: "Title, speaker, and date are required" }, { status: 400 });
    }
    const sermon = await prisma.sermon.create({
      data: {
        churchId: session.churchId,
        title,
        speaker,
        date: new Date(date),
        description: description || null,
        videoUrl: videoUrl || null,
        audioUrl: audioUrl || null,
        notesPdf: notesPdf || null,
        duration: duration ? parseInt(duration) : null,
      },
    });
    return NextResponse.json({ success: true, data: sermon });
  } catch { return NextResponse.json({ error: "Failed to create sermon" }, { status: 500 }); }
}
