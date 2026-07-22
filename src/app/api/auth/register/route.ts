import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { normalizePhone } from "@/lib/phone";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, churchName, phone, gender } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    if (!churchName && !phone) {
      return NextResponse.json(
        { error: "Phone number is required for member registration" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    let church;
    if (churchName) {
      church = await prisma.church.create({
        data: { name: churchName },
      });
    } else {
      church = await prisma.church.findFirst();
      if (!church) {
        church = await prisma.church.create({
          data: { name: "Sion Holy Church" },
        });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name.trim(),
        role: churchName ? "CHURCH_ADMIN" : "MEMBER",
        churchId: church.id,
      },
    });

    if (!churchName && phone) {
      const normalizedPhone = normalizePhone(phone);

      const existingMember = await prisma.member.findFirst({
        where: { churchId: church.id, email },
      });

      if (!existingMember) {
        try {
          await prisma.member.create({
            data: {
              churchId: church.id,
              fullName: name.trim(),
              email,
              phone: normalizedPhone,
              whatsappNumber: normalizedPhone,
              gender: gender || null,
              isSubscribed: true,
            },
          });
        } catch (memberError) {
          console.error("Failed to create member record:", memberError);
        }
      }
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      churchId: user.churchId,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });

    response.cookies.set("churchconnect_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
