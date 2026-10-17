import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { updateProductStock } from "@/lib/database";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Admin access required." }, { status: 401 });
  const { id } = await context.params;
  let body: { stock?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (!Number.isInteger(body.stock) || Number(body.stock) < 0 || Number(body.stock) > 100000) return NextResponse.json({ error: "Stock must be a non-negative whole number." }, { status: 400 });
  return await updateProductStock(id,Number(body.stock)) ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Product not found." }, { status: 404 });
}
