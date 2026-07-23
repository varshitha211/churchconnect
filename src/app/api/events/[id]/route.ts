import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const event = await prisma.event.findFirst({
      where: { id, churchId: session.churchId },
      include: {
        _count: {
          select: { recipients: true, rsvps: true, attendance: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: event });
  } catch (error) {
    console.error("Get event error:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.event.findFirst({
      where: { id, churchId: session.churchId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    const fields = [
      "name", "category", "description", "startTime", "venue",
      "locationLink", "organizerContact", "registrationReq",
      "voiceEnabled", "rsvpEnabled", "qrAttendance", "status",
    ];

    for (const field of fields) {
      if (body[field] !== undefined) updateData[field] = body[field];
    }

    if (body.startDate) updateData.startDate = new Date(body.startDate);
    if (body.endDate) updateData.endDate = new Date(body.endDate);

    const event = await prisma.event.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: event });
  } catch (error) {
    console.error("Update event error:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.event.findFirst({
      where: { id, churchId: session.churchId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const callCampaigns = await prisma.callCampaign.findMany({
      where: { eventId: id },
      select: { id: true },
    });
    for (const c of callCampaigns) {
      await prisma.callLog.deleteMany({ where: { campaignId: c.id } });
    }

    await prisma.qrCode.deleteMany({ where: { eventId: id } });
    await prisma.rsvp.deleteMany({ where: { eventId: id } });
    await prisma.eventRecipient.deleteMany({ where: { eventId: id } });
    await prisma.communicationLog.deleteMany({ where: { eventId: id } });
    await prisma.callCampaign.deleteMany({ where: { eventId: id } });
    await prisma.attendance.deleteMany({ where: { eventId: id } });
    await prisma.followUp.deleteMany({ where: { eventId: id } });
    await prisma.notificationLog.deleteMany({ where: { eventId: id } });

    await prisma.event.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    console.error("Delete event error:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
