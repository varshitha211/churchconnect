import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const member = await prisma.member.findFirst({ where: { churchId: session.churchId, email: session.email } });
    if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: member });
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const member = await prisma.member.findFirst({ where: { churchId: session.churchId, email: session.email } });
    if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (body.fullName) data.fullName = body.fullName;
    if (body.phone) data.phone = body.phone;
    if (body.email !== undefined) data.email = body.email;
    if (body.address !== undefined) data.address = body.address;
    if (body.bloodGroup !== undefined) data.bloodGroup = body.bloodGroup;
    if (body.dateOfBirth !== undefined) data.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null;
    if (body.familyMembers !== undefined) data.familyMembers = body.familyMembers;
    if (body.avatar !== undefined) data.avatar = body.avatar;
    const updated = await prisma.member.update({ where: { id: member.id }, data });
    return NextResponse.json({ success: true, data: updated });
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}
