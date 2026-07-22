import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { ITEMS_PER_PAGE } from "@/lib/constants";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const category = searchParams.get("category") || "";

    const where: Record<string, unknown> = {
      churchId: session.churchId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { venue: { contains: search } },
      ];
    }

    if (status) where.status = status;
    if (category) where.category = category;

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: { startDate: "desc" },
        skip: (page - 1) * ITEMS_PER_PAGE,
        take: ITEMS_PER_PAGE,
        include: {
          _count: {
            select: { recipients: true, rsvps: true, attendance: true },
          },
        },
      }),
      prisma.event.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: events,
      pagination: {
        page,
        perPage: ITEMS_PER_PAGE,
        total,
        totalPages: Math.ceil(total / ITEMS_PER_PAGE),
      },
    });
  } catch (error) {
    console.error("List events error:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name, category, description, startDate, endDate,
      startTime, venue, locationLink, organizerContact,
      registrationReq, voiceEnabled, rsvpEnabled, qrAttendance, status,
    } = body;

    if (!name || !category || !startDate || !startTime || !venue) {
      return NextResponse.json(
        { error: "Name, category, start date, time, and venue are required" },
        { status: 400 }
      );
    }

    let slug = slugify(name);
    const existingSlug = await prisma.event.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const event = await prisma.event.create({
      data: {
        churchId: session.churchId,
        createdBy: session.userId,
        name,
        slug,
        category,
        description: description || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        startTime,
        venue,
        locationLink: locationLink || null,
        organizerContact: organizerContact || null,
        registrationReq: registrationReq || false,
        voiceEnabled: voiceEnabled !== false,
        rsvpEnabled: rsvpEnabled !== false,
        qrAttendance: qrAttendance !== false,
        status: status || "DRAFT",
      },
    });

    return NextResponse.json({ success: true, data: event }, { status: 201 });
  } catch (error) {
    console.error("Create event error:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
