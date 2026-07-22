import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const templates = await prisma.messageTemplate.findMany({
      where: { churchId: session.churchId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: templates });
  } catch (error) {
    console.error("List templates error:", error);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, subject, body: msgBody, isDefault } = body;

    if (!name || !msgBody) {
      return NextResponse.json({ error: "Name and body are required" }, { status: 400 });
    }

    const template = await prisma.messageTemplate.create({
      data: {
        churchId: session.churchId,
        name,
        subject: subject || null,
        body: msgBody,
        isDefault: isDefault || false,
      },
    });

    return NextResponse.json({ success: true, data: template }, { status: 201 });
  } catch (error) {
    console.error("Create template error:", error);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}
