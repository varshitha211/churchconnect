import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { normalizePhone } from "@/lib/phone";
import { Prisma } from "@prisma/client";

interface CsvRow {
  fullName?: string;
  name?: string;
  phone?: string;
  whatsappNumber?: string;
  email?: string;
  ageGroup?: string;
  gender?: string;
  area?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!file.name.endsWith(".csv")) {
      return NextResponse.json({ error: "Only CSV files are supported" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim());

    if (lines.length < 2) {
      return NextResponse.json({ error: "CSV must have a header row and at least one data row" }, { status: 400 });
    }

    const headerLine = lines[0].toLowerCase();
    const headers = headerLine.split(",").map((h) => h.trim().replace(/"/g, ""));

    const nameIdx = headers.findIndex((h) => h === "fullname" || h === "name" || h === "full_name");
    const phoneIdx = headers.findIndex((h) => h === "phone" || h === "phone_number" || h === "mobile");
    const whatsappIdx = headers.findIndex((h) => h === "whatsapp" || h === "whatsapp_number");
    const emailIdx = headers.findIndex((h) => h === "email");
    const ageGroupIdx = headers.findIndex((h) => h === "agegroup" || h === "age_group" || h === "age");
    const genderIdx = headers.findIndex((h) => h === "gender");
    const areaIdx = headers.findIndex((h) => h === "area" || h === "location" || h === "address");

    if (nameIdx === -1 || phoneIdx === -1) {
      return NextResponse.json(
        { error: "CSV must have at least 'fullName' (or 'name') and 'phone' columns" },
        { status: 400 }
      );
    }

    const results = { total: 0, imported: 0, skipped: 0, errors: [] as string[] };

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""));
      results.total++;

      const fullName = values[nameIdx]?.trim();
      const rawPhone = values[phoneIdx]?.trim();

      if (!fullName || !rawPhone) {
        results.skipped++;
        results.errors.push(`Row ${i + 1}: Missing name or phone`);
        continue;
      }

      const phone = normalizePhone(rawPhone);
      if (!phone || phone.length < 12) {
        results.skipped++;
        results.errors.push(`Row ${i + 1}: Invalid phone "${rawPhone}"`);
        continue;
      }

      const existing = await prisma.member.findUnique({
        where: {
          churchId_phone: {
            churchId: session.churchId,
            phone,
          },
        },
      });

      if (existing) {
        results.skipped++;
        results.errors.push(`Row ${i + 1}: Phone ${phone} already exists`);
        continue;
      }

      const data: Prisma.MemberUncheckedCreateInput = {
        churchId: session.churchId,
        fullName,
        phone,
        whatsappNumber: whatsappIdx !== -1 ? normalizePhone(values[whatsappIdx]) || phone : phone,
        isSubscribed: true,
      };

      if (emailIdx !== -1 && values[emailIdx]) data.email = values[emailIdx];
      if (ageGroupIdx !== -1 && values[ageGroupIdx]) data.ageGroup = values[ageGroupIdx].toUpperCase();
      if (genderIdx !== -1 && values[genderIdx]) data.gender = values[genderIdx].toUpperCase();
      if (areaIdx !== -1 && values[areaIdx]) data.area = values[areaIdx];

      try {
        await prisma.member.create({ data });
        results.imported++;
      } catch {
        results.skipped++;
        results.errors.push(`Row ${i + 1}: Database error`);
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("CSV import error:", error);
    return NextResponse.json(
      { error: "Failed to import CSV" },
      { status: 500 }
    );
  }
}
