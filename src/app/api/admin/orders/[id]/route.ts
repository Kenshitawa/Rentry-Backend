import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { updateOrderStatus } from "@/lib/database";

const statuses = new Set(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]);
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Admin access required." }, { status: 401 });
  const { id } = await context.params;
  let body: { status?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (typeof body.status !== "string" || !statuses.has(body.status)) return NextResponse.json({ error: "Invalid order status." }, { status: 400 });
  return await updateOrderStatus(id,body.status) ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Order not found." }, { status: 404 });
}
