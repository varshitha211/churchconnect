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
    const campaigns = await prisma.callCampaign.findMany({
      where: { eventId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: campaigns });
  } catch (error) {
    console.error("List campaigns error:", error);
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
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
    const { name, maxRetries, retryDelayMin } = body;

    const event = await prisma.event.findFirst({
      where: { id, churchId: session.churchId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const recipients = await prisma.eventRecipient.findMany({
      where: { eventId: id },
      include: { member: true },
    });

    if (recipients.length === 0) {
      return NextResponse.json({ error: "No recipients found for this event" }, { status: 400 });
    }

    const campaign = await prisma.callCampaign.create({
      data: {
        eventId: id,
        name: name || `Campaign for ${event.name}`,
        maxRetries: maxRetries || 2,
        retryDelayMin: retryDelayMin || 30,
        totalCalls: recipients.length,
        status: "RUNNING",
        startedAt: new Date(),
      },
    });

    const mockStatuses = ["ANSWERED", "ANSWERED", "ANSWERED", "NO_ANSWER", "BUSY", "FAILED"];

    for (const recipient of recipients) {
      const randomStatus = mockStatuses[Math.floor(Math.random() * mockStatuses.length)];

      await prisma.callLog.create({
        data: {
          campaignId: campaign.id,
          memberId: recipient.memberId,
          phone: recipient.member.phone,
          status: randomStatus,
          attempts: 1,
          lastAttemptAt: new Date(),
          callDuration: randomStatus === "ANSWERED" ? Math.floor(Math.random() * 120) + 10 : 0,
          retryCount: 0,
        },
      });

      if (randomStatus === "ANSWERED") {
        await prisma.callCampaign.update({
          where: { id: campaign.id },
          data: { answered: { increment: 1 } },
        });
      } else if (randomStatus === "NO_ANSWER") {
        await prisma.callCampaign.update({
          where: { id: campaign.id },
          data: { noAnswer: { increment: 1 } },
        });
      } else if (randomStatus === "BUSY") {
        await prisma.callCampaign.update({
          where: { id: campaign.id },
          data: { busy: { increment: 1 } },
        });
      } else {
        await prisma.callCampaign.update({
          where: { id: campaign.id },
          data: { failed: { increment: 1 } },
        });
      }
    }

    await prisma.callCampaign.update({
      where: { id: campaign.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    return NextResponse.json({ success: true, data: campaign }, { status: 201 });
  } catch (error) {
    console.error("Create campaign error:", error);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
