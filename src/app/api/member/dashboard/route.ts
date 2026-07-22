import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const member = await prisma.member.findFirst({
      where: { churchId: session.churchId, isArchived: false, email: session.email },
    });

    if (!member) return NextResponse.json({ error: "Member profile not found" }, { status: 404 });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [totalEvents, attendedMonth, attendedYear, upcomingEvents, recentPrayers, announcements, unreadNotifs] = await Promise.all([
      prisma.event.count({ where: { churchId: session.churchId, status: { in: ["PUBLISHED", "LIVE"] } } }),
      prisma.attendance.count({ where: { memberId: member.id, checkedInAt: { gte: startOfMonth } } }),
      prisma.attendance.count({ where: { memberId: member.id, checkedInAt: { gte: startOfYear } } }),
      prisma.event.findMany({
        where: { churchId: session.churchId, status: { in: ["PUBLISHED", "LIVE"] }, startDate: { gte: now } },
        orderBy: { startDate: "asc" },
        take: 3,
        select: { id: true, name: true, slug: true, startDate: true, startTime: true, venue: true, category: true },
      }),
      prisma.prayerRequest.findMany({
        where: { memberId: member.id },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      prisma.announcement.findMany({
        where: { churchId: session.churchId, isPublished: true },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      prisma.userNotification.count({ where: { memberId: member.id, isRead: false } }),
    ]);

    const totalSundaysInMonth = Math.ceil((new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()) / 7);

    return NextResponse.json({
      success: true,
      data: {
        member: { name: member.fullName, email: member.email, avatar: member.avatar },
        stats: {
          attendanceMonth: attendedMonth,
          attendanceYear: attendedYear,
          attendancePercent: totalSundaysInMonth > 0 ? Math.round((attendedMonth / totalSundaysInMonth) * 100) : 0,
          upcomingEvents: totalEvents,
          prayerRequests: recentPrayers.length,
          unreadNotifications: unreadNotifs,
        },
        upcomingEvents,
        recentPrayers,
        announcements,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
