import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      where: { status: { in: ["PUBLISHED", "LIVE"] } },
      orderBy: { startDate: "desc" },
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
        status: true,
        rsvpEnabled: true,
        rsvps: {
          select: { response: true },
        },
      },
    });

    const data = events.map((e: any) => ({
      ...e,
      rsvpCounts: {
        attending: e.rsvps.filter((r: any) => r.response === "ATTENDING").length,
        maybe: e.rsvps.filter((r: any) => r.response === "MAYBE").length,
        notAttending: e.rsvps.filter((r: any) => r.response === "NOT_ATTENDING").length,
      },
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Public events error:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
