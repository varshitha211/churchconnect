import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [
      totalMembers,
      activeEvents,
      upcomingEvents,
      notificationStats,
      communicationStats,
      callStats,
      rsvpCount,
      attendanceCount,
    ] = await Promise.all([
      prisma.member.count({ where: { isArchived: false } }),
      prisma.event.count({ where: { status: { in: ["DRAFT", "PUBLISHED"] } } }),
      prisma.event.count({
        where: {
          status: "PUBLISHED",
          startDate: { gte: new Date() },
        },
      }),
      prisma.notificationLog.aggregate({
        _sum: { totalSent: true, totalDelivered: true, totalOpened: true },
      }),
      prisma.communicationLog.groupBy({
        by: ["channel", "status"],
        _count: true,
      }),
      prisma.callLog.groupBy({
        by: ["status"],
        _count: true,
      }),
      prisma.rsvp.count(),
      prisma.attendance.count(),
    ]);

    const whatsappPrepared =
      communicationStats
        .filter((c) => c.channel === "WHATSAPP")
        .reduce((sum, c) => sum + c._count, 0) || 0;

    const whatsappSent =
      communicationStats
        .filter(
          (c) =>
            c.channel === "WHATSAPP" &&
            ["SENT", "DELIVERED", "OPENED"].includes(c.status)
        )
        .reduce((sum, c) => sum + c._count, 0) || 0;

    const totalCalls =
      callStats.reduce((sum, c) => sum + c._count, 0) || 0;

    const callsAnswered =
      callStats
        .filter((c) => c.status === "ANSWERED" || c.status === "COMPLETED")
        .reduce((sum, c) => sum + c._count, 0) || 0;

    const callsNoAnswer =
      callStats
        .filter((c) => c.status === "NO_ANSWER")
        .reduce((sum, c) => sum + c._count, 0) || 0;

    const callsBusy =
      callStats
        .filter((c) => c.status === "BUSY")
        .reduce((sum, c) => sum + c._count, 0) || 0;

    const callsFailed =
      callStats
        .filter((c) => c.status === "FAILED")
        .reduce((sum, c) => sum + c._count, 0) || 0;

    return NextResponse.json({
      success: true,
      data: {
        totalMembers,
        activeEvents,
        upcomingEvents,
        notificationsSent: notificationStats._sum.totalSent || 0,
        notificationsOpened: notificationStats._sum.totalOpened || 0,
        whatsappPrepared,
        whatsappSent,
        totalCalls,
        callsAnswered,
        callsNoAnswer,
        callsBusy,
        callsFailed,
        totalRsvp: rsvpCount,
        totalAttendance: attendanceCount,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
