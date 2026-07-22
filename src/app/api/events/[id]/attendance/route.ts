import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const attendance = await prisma.attendance.findMany({
      where: { eventId: id },
      include: { member: { select: { fullName: true, phone: true } } },
      orderBy: { checkedInAt: "desc" },
    });

    return NextResponse.json({ success: true, data: attendance });
  } catch (error) {
    console.error("List attendance error:", error);
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}

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
    const { memberId, token, method } = body;

    let targetMemberId = memberId;

    if (token && !targetMemberId) {
      const qr = await prisma.qrCode.findUnique({ where: { token } });
      if (!qr || qr.eventId !== id) {
        return NextResponse.json({ error: "Invalid QR code" }, { status: 400 });
      }
      if (qr.isCheckedIn) {
        return NextResponse.json({ error: "Already checked in" }, { status: 409 });
      }
      targetMemberId = qr.memberId;

      await prisma.qrCode.update({
        where: { id: qr.id },
        data: { isCheckedIn: true, checkedInAt: new Date() },
      });
    }

    if (!targetMemberId) {
      return NextResponse.json({ error: "memberId or token is required" }, { status: 400 });
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
        method: method || "MANUAL",
        checkedInBy: session.userId,
      },
    });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json({ error: "Failed to check in" }, { status: 500 });
  }
}
