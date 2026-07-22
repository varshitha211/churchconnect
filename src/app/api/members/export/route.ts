import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const members = await prisma.member.findMany({
      where: { churchId: session.churchId, isArchived: false },
      orderBy: { fullName: "asc" },
    });

    const header = "fullName,phone,whatsappNumber,email,ageGroup,gender,area\n";
    const rows = members
      .map(
        (m: any) =>
          `"${m.fullName}","${m.phone}","${m.whatsappNumber || ""}","${m.email || ""}","${m.ageGroup || ""}","${m.gender || ""}","${m.area || ""}"`
      )
      .join("\n");

    return new NextResponse(header + rows, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="members-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export members error:", error);
    return NextResponse.json(
      { error: "Failed to export members" },
      { status: 500 }
    );
  }
}
