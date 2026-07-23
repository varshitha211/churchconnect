import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(
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
    const { token, memberId } = body;

    let targetMemberId = memberId;

    if (token && !targetMemberId) {
      let decoded = decodeURIComponent(token);

      try {
        if (decoded.includes("/scan?token=")) {
          const url = new URL(decoded);
          decoded = url.searchParams.get("token") || decoded;
        }
      } catch {}

      if (decoded.startsWith("event:")) {
        return NextResponse.json({
          success: false,
          isVenueQr: true,
          message: "This is a venue QR code. Members should scan it with their phone.",
        });
      }

      const colonIdx = decoded.indexOf(":");
      if (colonIdx > 0 && colonIdx < decoded.length - 1) {
        targetMemberId = decoded.substring(0, colonIdx);
        const tokenId = decoded.substring(colonIdx + 1);
        if (tokenId !== id) {
          return NextResponse.json({ error: "QR code is for a different event" }, { status: 400 });
        }
      } else {
        const qr = await prisma.qrCode.findUnique({ where: { token: decoded } });
        if (!qr || qr.eventId !== id) {
          return NextResponse.json({ error: "Invalid QR code" }, { status: 400 });
        }
        if (qr.isCheckedIn) {
          return NextResponse.json({ error: "Already checked in via this QR" }, { status: 409 });
        }
        targetMemberId = qr.memberId;
        await prisma.qrCode.update({
          where: { id: qr.id },
          data: { isCheckedIn: true, checkedInAt: new Date() },
        });
      }
    }

    if (!targetMemberId) {
      return NextResponse.json({ error: "memberId or token required" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (event.status !== "LIVE") {
      return NextResponse.json({ error: "This event is not available for check-in" }, { status: 400 });
    }

    const member = await prisma.member.findUnique({
      where: { id: targetMemberId },
      select: { id: true, fullName: true },
    });
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const existing = await prisma.attendance.findFirst({
      where: { eventId: id, memberId: targetMemberId },
    });
    if (existing) {
      return NextResponse.json({ error: "Already checked in" }, { status: 409 });
    }

    const record = await prisma.attendance.create({
      data: {
        eventId: id,
        memberId: targetMemberId,
        method: token ? "QR_SCAN" : "MANUAL",
        checkedInBy: session.userId,
      },
    });

    return NextResponse.json(
      { success: true, data: record, memberName: member.fullName },
      { status: 201 }
    );
  } catch (error) {
    console.error("QR check-in error:", error);
    return NextResponse.json({ error: "Failed to check in" }, { status: 500 });
  }
}
