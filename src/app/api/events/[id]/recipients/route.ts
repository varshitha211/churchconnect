import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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
    const recipients = await prisma.eventRecipient.findMany({
      where: { eventId: id },
      include: { member: true },
      orderBy: { member: { fullName: "asc" } },
    });

    return NextResponse.json({ success: true, data: recipients });
  } catch (error) {
    console.error("List recipients error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipients" },
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

    let added = 0;
    for (const memberId of memberIds) {
      try {
        await prisma.eventRecipient.create({
          data: { eventId: id, memberId, status: "SELECTED" },
        });
        added++;
      } catch {
        // Skip duplicates
      }
    }

    return NextResponse.json({
      success: true,
      data: { added, total: memberIds.length },
    });
  } catch (error) {
    console.error("Add recipients error:", error);
    return NextResponse.json(
      { error: "Failed to add recipients" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const { recipientIds } = body;

    if (!recipientIds || !Array.isArray(recipientIds)) {
      return NextResponse.json(
        { error: "recipientIds array is required" },
        { status: 400 }
      );
    }

    await prisma.eventRecipient.deleteMany({
      where: { id: { in: recipientIds }, eventId: id },
    });

    return NextResponse.json({ success: true, message: "Recipients removed" });
  } catch (error) {
    console.error("Remove recipients error:", error);
    return NextResponse.json(
      { error: "Failed to remove recipients" },
      { status: 500 }
    );
  }
}
