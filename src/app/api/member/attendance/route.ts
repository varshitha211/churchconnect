import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const member = await prisma.member.findFirst({
      where: { churchId: session.churchId, email: session.email },
    });

    if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [monthAttendance, yearAttendance, totalEvents] = await Promise.all([
      prisma.attendance.findMany({
        where: { memberId: member.id, checkedInAt: { gte: startOfMonth } },
        include: { event: { select: { name: true, startDate: true, venue: true } } },
        orderBy: { checkedInAt: "desc" },
      }),
      prisma.attendance.findMany({
        where: { memberId: member.id, checkedInAt: { gte: startOfYear } },
        include: { event: { select: { name: true, startDate: true } } },
        orderBy: { checkedInAt: "desc" },
      }),
      prisma.event.count({ where: { churchId: session.churchId, status: { in: ["PUBLISHED", "LIVE"] }, startDate: { gte: startOfYear } } }),
    ]);

    const monthlyData: Record<string, number> = {};
    for (const r of yearAttendance) {
      const m = new Date(r.checkedInAt).toLocaleString("en-US", { month: "short" });
      monthlyData[m] = (monthlyData[m] || 0) + 1;
    }

    const calendarDays: Record<string, boolean> = {};
    for (const r of monthAttendance) {
      const day = new Date(r.checkedInAt).getDate().toString();
      calendarDays[day] = true;
    }

    return NextResponse.json({
      success: true,
      data: {
        monthAttendance,
        yearAttendance: Object.entries(monthlyData).map(([month, count]) => ({ month, count })),
        calendarDays,
        stats: {
          monthCount: monthAttendance.length,
          yearCount: yearAttendance.length,
          totalEvents,
          percentage: totalEvents > 0 ? Math.round((yearAttendance.length / totalEvents) * 100) : 0,
        },
      },
    });
  } catch (error) {
    console.error("My attendance error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
