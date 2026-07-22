import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendEmailInvite, buildInviteEmailHtml } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { eventId, memberIds, subject, html } = body;

    if (!eventId || !memberIds || !Array.isArray(memberIds)) {
      return NextResponse.json(
        { error: "eventId and memberIds are required" },
        { status: 400 }
      );
    }

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json(
        { error: "Email not configured. Set SMTP_USER and SMTP_PASS in .env" },
        { status: 500 }
      );
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const members = await prisma.member.findMany({
      where: { id: { in: memberIds }, email: { not: null } },
    });

    let sent = 0;
    let failed = 0;

    for (const member of members) {
      if (!member.email) continue;
      try {
        const dateStr = new Date(event.startDate).toLocaleDateString("en-IN", {
          year: "numeric", month: "long", day: "numeric",
        });

        const emailHtml =
          html ||
          buildInviteEmailHtml({
            eventName: event.name,
            date: dateStr,
            time: event.startTime,
            venue: event.venue,
            eventLink: `${process.env.NEXT_PUBLIC_APP_URL}/event/${event.slug}`,
            churchName: "Sion Holy Church",
            rsvpLink: `${process.env.NEXT_PUBLIC_APP_URL}/event/${event.slug}`,
            memberName: member.fullName,
          });

        await sendEmailInvite({
          to: member.email,
          subject: subject || `You're Invited: ${event.name}`,
          html: emailHtml,
        });

        await prisma.communicationLog.create({
          data: {
            eventId,
            memberId: member.id,
            channel: "EMAIL",
            status: "SENT",
            messageContent: subject || `Invitation: ${event.name}`,
          },
        });

        sent++;
      } catch (err) {
        console.error(`Email failed for ${member.email}:`, err);
        failed++;

        await prisma.communicationLog.create({
          data: {
            eventId,
            memberId: member.id,
            channel: "EMAIL",
            status: "FAILED",
          },
        }).catch(() => {});
      }
    }

    return NextResponse.json({ success: true, sent, failed, total: members.length });
  } catch (error) {
    console.error("Send email error:", error);
    return NextResponse.json(
      { error: "Failed to send emails" },
      { status: 500 }
    );
  }
}
