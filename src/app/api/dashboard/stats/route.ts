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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const commStats = communicationStats as any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cStats = callStats as any[];

    const whatsappPrepared =
      commStats
        .filter((c: { channel: string }) => c.channel === "WHATSAPP")
        .reduce((sum: number, c: { _count: number }) => sum + c._count, 0) || 0;

    const whatsappSent =
      commStats
        .filter(
          (c: { channel: string; status: string }) =>
            c.channel === "WHATSAPP" &&
            ["SENT", "DELIVERED", "OPENED"].includes(c.status)
        )
        .reduce((sum: number, c: { _count: number }) => sum + c._count, 0) || 0;

    const totalCalls =
      cStats.reduce((sum: number, c: { _count: number }) => sum + c._count, 0) || 0;

    const callsAnswered =
      cStats
        .filter((c: { status: string }) => c.status === "ANSWERED" || c.status === "COMPLETED")
        .reduce((sum: number, c: { _count: number }) => sum + c._count, 0) || 0;

    const callsNoAnswer =
      cStats
        .filter((c: { status: string }) => c.status === "NO_ANSWER")
        .reduce((sum: number, c: { _count: number }) => sum + c._count, 0) || 0;

    const callsBusy =
      cStats
        .filter((c: { status: string }) => c.status === "BUSY")
        .reduce((sum: number, c: { _count: number }) => sum + c._count, 0) || 0;

    const callsFailed =
      cStats
        .filter((c: { status: string }) => c.status === "FAILED")
        .reduce((sum: number, c: { _count: number }) => sum + c._count, 0) || 0;

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
