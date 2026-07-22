import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Donations feature is not available" }, { status: 404 });
}
