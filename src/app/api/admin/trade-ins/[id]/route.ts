import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { updateTradeInStatus } from "@/lib/database";

const statuses = new Set(["NEW", "CONTACTED", "QUOTED", "ACCEPTED", "DECLINED", "CLOSED"]);
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Admin access required." }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json();
    const status = typeof body.status === "string" ? body.status.toUpperCase() : "";
    if (!statuses.has(status)) return NextResponse.json({ error: "Choose a valid inquiry status." }, { status: 400 });
    if (!await updateTradeInStatus(id, status)) return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Could not update inquiry." }, { status: 400 }); }
}
