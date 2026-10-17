import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getDashboard } from "@/lib/database";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!process.env.ADMIN_API_KEY) return NextResponse.json({ error: "Admin access is not configured. Set ADMIN_API_KEY in .env.local." }, { status: 503 });
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Sign in to view store data." }, { status: 401 });
  try {
    return NextResponse.json(await getDashboard());
  } catch (error) {
    console.error("Admin dashboard unavailable", error);
    return NextResponse.json({ error: "The store database could not be opened. Check the database file path and permissions, then refresh." }, { status: 503 });
  }
}
