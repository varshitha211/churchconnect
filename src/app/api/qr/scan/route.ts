import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { token, memberId } = await request.json();
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    let decoded = decodeURIComponent(token);

    if (decoded.includes("/scan?token=")) {
      try {
        const url = new URL(decoded);
        decoded = url.searchParams.get("token") || decoded;
      } catch {}
    }

    if (decoded.startsWith("event:")) {
      const eventId = decoded.replace("event:", "");

      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true, name: true, status: true, churchId: true },
      });
      if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }
      if (event.status !== "LIVE") {
        return NextResponse.json({ error: "This event is not available for check-in" }, { status: 400 });
      }

      if (!memberId) {
        return NextResponse.json({
          success: false,
          needsMemberSelection: true,
          eventId: event.id,
          eventName: event.name,
          message: "Please provide your member ID to check in",
        });
      }

      const member = await prisma.member.findUnique({
        where: { id: memberId },
        select: { id: true, fullName: true },
      });
      if (!member) {
        return NextResponse.json({ error: "Member not found" }, { status: 404 });
      }

      const existing = await prisma.attendance.findFirst({
        where: { eventId, memberId },
      });
      if (existing) {
        return NextResponse.json({ error: "Already checked in" }, { status: 409 });
      }

      await prisma.attendance.create({
        data: {
          eventId,
          memberId,
          method: "QR_SCAN",
        },
      });

      return NextResponse.json({
        success: true,
        memberName: member.fullName,
        eventName: event.name,
      });
    }

    const colonParts = decoded.split(":");
    if (colonParts.length === 2) {
      const memberTokenId = colonParts[0];
      const eventIdToken = colonParts[1];

      const member = await prisma.member.findUnique({
        where: { id: memberTokenId },
        select: { id: true, fullName: true },
      });
      if (!member) {
        return NextResponse.json({ error: "Member not found" }, { status: 404 });
      }

      const event = await prisma.event.findUnique({
        where: { id: eventIdToken },
        select: { id: true, name: true, status: true },
      });
      if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }
      if (event.status !== "LIVE") {
        return NextResponse.json({ error: "This event is not available for check-in" }, { status: 400 });
      }

      const existing = await prisma.attendance.findFirst({
        where: { eventId: eventIdToken, memberId: memberTokenId },
      });
      if (existing) {
        return NextResponse.json({ error: "Already checked in" }, { status: 409 });
      }

      await prisma.attendance.create({
        data: {
          eventId: eventIdToken,
          memberId: memberTokenId,
          method: "QR_SCAN",
        },
      });

      return NextResponse.json({
        success: true,
        memberName: member.fullName,
        eventName: event.name,
      });
    }

    const qr = await prisma.qrCode.findUnique({ where: { token: decoded } });
    if (!qr) {
      return NextResponse.json({ error: "Invalid QR code" }, { status: 404 });
    }

    if (qr.isCheckedIn) {
      return NextResponse.json({ error: "Already checked in" }, { status: 409 });
    }

    if (!qr.memberId) {
      return NextResponse.json({ error: "QR code has no member assigned" }, { status: 400 });
    }

    const existing = await prisma.attendance.findFirst({
      where: { eventId: qr.eventId, memberId: qr.memberId },
    });
    if (existing) {
      return NextResponse.json({ error: "Already checked in" }, { status: 409 });
    }

    await prisma.qrCode.update({
      where: { id: qr.id },
      data: { isCheckedIn: true, checkedInAt: new Date() },
    });

    await prisma.attendance.create({
      data: {
        eventId: qr.eventId,
        memberId: qr.memberId,
        method: "QR_SCAN",
      },
    });

    const member = await prisma.member.findUnique({
      where: { id: qr.memberId },
      select: { fullName: true },
    });

    const event = await prisma.event.findUnique({
      where: { id: qr.eventId },
      select: { name: true },
    });

    return NextResponse.json({
      success: true,
      memberName: member?.fullName || "Unknown",
      eventName: event?.name || "Unknown Event",
    });
  } catch (error) {
    console.error("QR scan error:", error);
    return NextResponse.json({ error: "Check-in failed" }, { status: 500 });
  }
}
