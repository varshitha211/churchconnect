import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { response, guestName, guestCount, prayerRequest, message, memberPhone } = body;

    if (!response || !["ATTENDING", "MAYBE", "NOT_ATTENDING"].includes(response)) {
      return NextResponse.json(
        { error: "Valid response is required (ATTENDING, MAYBE, NOT_ATTENDING)" },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({ where: { slug } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    let memberId: string | null = null;
    if (memberPhone) {
      const member = await prisma.member.findFirst({
        where: { phone: memberPhone },
      });
      if (member) memberId = member.id;
    }

    const existingRsvp = await prisma.rsvp.findFirst({
      where: {
        eventId: event.id,
        memberId: memberId || undefined,
        guestName: memberId ? undefined : guestName,
      },
    });

    if (existingRsvp) {
      const updated = await prisma.rsvp.update({
        where: { id: existingRsvp.id },
        data: {
          response,
          guestCount: guestCount || 0,
          prayerRequest: prayerRequest || null,
          message: message || null,
        },
      });
      return NextResponse.json({ success: true, data: updated, updated: true });
    }

    const rsvp = await prisma.rsvp.create({
      data: {
        eventId: event.id,
        memberId,
        guestName: guestName || null,
        response,
        guestCount: guestCount || 0,
        prayerRequest: prayerRequest || null,
        message: message || null,
      },
    });

    return NextResponse.json({ success: true, data: rsvp }, { status: 201 });
  } catch (error) {
    console.error("RSVP error:", error);
    return NextResponse.json(
      { error: "Failed to submit RSVP" },
      { status: 500 }
    );
  }
}
