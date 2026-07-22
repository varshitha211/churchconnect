import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const event = await prisma.event.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        description: true,
        startDate: true,
        endDate: true,
        startTime: true,
        venue: true,
        locationLink: true,
        organizerContact: true,
        rsvpEnabled: true,
        voiceEnabled: true,
        qrAttendance: true,
        status: true,
      },
    });

    if (!event || event.status === "DRAFT") {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const rsvpCounts = await prisma.rsvp.groupBy({
      by: ["response"],
      where: { eventId: event.id },
      _count: true,
    });

    const counts: Record<string, number> = {};
    rsvpCounts.forEach((r) => { counts[r.response] = r._count; });

    return NextResponse.json({
      success: true,
      data: {
        ...event,
        rsvpCounts: {
          attending: counts["ATTENDING"] || 0,
          maybe: counts["MAYBE"] || 0,
          notAttending: counts["NOT_ATTENDING"] || 0,
        },
      },
    });
  } catch (error) {
    console.error("Public event error:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}
