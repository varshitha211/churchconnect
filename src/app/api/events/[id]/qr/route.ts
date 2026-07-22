import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { generateBulkQr } from "@/lib/qr";

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
    const qrCodes = await prisma.qrCode.findMany({
      where: { eventId: id },
      include: {
        member: { select: { id: true, fullName: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: qrCodes });
  } catch (error) {
    console.error("List QR codes error:", error);
    return NextResponse.json(
      { error: "Failed to fetch QR codes" },
      { status: 500 }
    );
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
    const { memberIds } = body;

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json(
        { error: "memberIds array is required" },
        { status: 400 }
      );
    }

    const event = await prisma.event.findFirst({
      where: { id, churchId: session.churchId },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const qrCodes = await generateBulkQr(id, memberIds);
    return NextResponse.json({ success: true, data: qrCodes }, { status: 201 });
  } catch (error) {
    console.error("Generate QR codes error:", error);
    return NextResponse.json(
      { error: "Failed to generate QR codes" },
      { status: 500 }
    );
  }
}
