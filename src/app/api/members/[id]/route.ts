import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { normalizePhone, isValidPhone } from "@/lib/phone";

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
    const member = await prisma.member.findFirst({
      where: { id, churchId: session.churchId },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: member });
  } catch (error) {
    console.error("Get member error:", error);
    return NextResponse.json(
      { error: "Failed to fetch member" },
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

    const existing = await prisma.member.findFirst({
      where: { id, churchId: session.churchId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (body.fullName) updateData.fullName = body.fullName.trim();
    if (body.phone) {
      const normalizedPhone = normalizePhone(body.phone);
      if (!isValidPhone(normalizedPhone)) {
        return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
      }
      if (normalizedPhone !== existing.phone) {
        const duplicate = await prisma.member.findUnique({
          where: {
            churchId_phone: {
              churchId: session.churchId,
              phone: normalizedPhone,
            },
          },
        });
        if (duplicate && duplicate.id !== id) {
          return NextResponse.json(
            { error: "A member with this phone number already exists" },
            { status: 409 }
          );
        }
      }
      updateData.phone = normalizedPhone;
    }
    if (body.whatsappNumber !== undefined) {
      updateData.whatsappNumber = body.whatsappNumber ? normalizePhone(body.whatsappNumber) : null;
    }
    if (body.email !== undefined) updateData.email = body.email || null;
    if (body.ageGroup !== undefined) updateData.ageGroup = body.ageGroup || null;
    if (body.gender !== undefined) updateData.gender = body.gender || null;
    if (body.area !== undefined) updateData.area = body.area || null;
    if (body.isSubscribed !== undefined) updateData.isSubscribed = body.isSubscribed;

    const member = await prisma.member.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: member });
  } catch (error) {
    console.error("Update member error:", error);
    return NextResponse.json(
      { error: "Failed to update member" },
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
    const existing = await prisma.member.findFirst({
      where: { id, churchId: session.churchId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    await prisma.member.update({
      where: { id },
      data: { isArchived: true },
    });

    return NextResponse.json({ success: true, message: "Member archived" });
  } catch (error) {
    console.error("Delete member error:", error);
    return NextResponse.json(
      { error: "Failed to delete member" },
      { status: 500 }
    );
  }
}
