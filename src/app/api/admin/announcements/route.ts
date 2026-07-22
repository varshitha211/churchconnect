import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: announcements });
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await request.json();
    const { title, description, priority, isPublished } = body;
    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
    }
    const announcement = await prisma.announcement.create({
      data: {
        churchId: session.churchId,
        title,
        description,
        priority: priority || "NORMAL",
        isPublished: isPublished !== false,
      },
    });
    return NextResponse.json({ success: true, data: announcement });
  } catch { return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 }); }
}
