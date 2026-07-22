import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { normalizePhone, isValidPhone } from "@/lib/phone";
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
    const gender = searchParams.get("gender") || "";
    const ageGroup = searchParams.get("ageGroup") || "";
    const area = searchParams.get("area") || "";
    const subscribed = searchParams.get("subscribed");

    const where: Record<string, unknown> = {
      churchId: session.churchId,
      isArchived: false,
    };

    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (gender) where.gender = gender;
    if (ageGroup) where.ageGroup = ageGroup;
    if (area) where.area = area;
    if (subscribed !== null && subscribed !== undefined) {
      where.isSubscribed = subscribed === "true";
    }

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * ITEMS_PER_PAGE,
        take: ITEMS_PER_PAGE,
      }),
      prisma.member.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: members,
      pagination: {
        page,
        perPage: ITEMS_PER_PAGE,
        total,
        totalPages: Math.ceil(total / ITEMS_PER_PAGE),
      },
    });
  } catch (error) {
    console.error("List members error:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
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
    const { fullName, phone, whatsappNumber, email, ageGroup, gender, area, isSubscribed } = body;

    if (!fullName || !phone) {
      return NextResponse.json(
        { error: "Full name and phone are required" },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(phone);
    if (!isValidPhone(normalizedPhone)) {
      return NextResponse.json(
        { error: "Invalid phone number" },
        { status: 400 }
      );
    }

    const existing = await prisma.member.findUnique({
      where: {
        churchId_phone: {
          churchId: session.churchId,
          phone: normalizedPhone,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A member with this phone number already exists" },
        { status: 409 }
      );
    }

    const member = await prisma.member.create({
      data: {
        churchId: session.churchId,
        fullName: fullName.trim(),
        phone: normalizedPhone,
        whatsappNumber: whatsappNumber ? normalizePhone(whatsappNumber) : normalizedPhone,
        email: email || null,
        ageGroup: ageGroup || null,
        gender: gender || null,
        area: area || null,
        isSubscribed: isSubscribed !== false,
      },
    });

    return NextResponse.json({ success: true, data: member }, { status: 201 });
  } catch (error) {
    console.error("Create member error:", error);
    return NextResponse.json(
      { error: "Failed to create member" },
      { status: 500 }
    );
  }
}
