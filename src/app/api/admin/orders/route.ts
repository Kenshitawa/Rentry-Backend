import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { createOrder } from "@/lib/database";

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Sign in to create an order." }, { status: 401 });
  let body: { name?: unknown; phone?: unknown; address?: unknown; items?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
  let phone = typeof body.phone === "string" ? body.phone.replace(/[\s()+-]/g, "") : "";
  if (/^0[17]\d{8}$/.test(phone)) phone = `254${phone.slice(1)}`;
  const address = typeof body.address === "string" ? body.address.trim().slice(0, 500) : "";
  const rawItems = Array.isArray(body.items) ? body.items : [];
  if (name.length < 2 || !/^254[17]\d{8}$/.test(phone) || address.length < 4 || rawItems.length < 1 || rawItems.length > 30) {
    return NextResponse.json({ error: "Enter a customer name, valid Kenyan phone, delivery note, and at least one product." }, { status: 400 });
  }
  const quantities = new Map<string, number>();
  for (const raw of rawItems) {
    if (!raw || typeof raw !== "object") return NextResponse.json({ error: "Invalid order item." }, { status: 400 });
    const item = raw as { productId?: unknown; quantity?: unknown };
    if (typeof item.productId !== "string" || !Number.isInteger(item.quantity) || Number(item.quantity) < 1 || Number(item.quantity) > 500) {
      return NextResponse.json({ error: "Each item needs a valid product and quantity." }, { status: 400 });
    }
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + Number(item.quantity));
  }
  try {
    const order = await createOrder({ name, phone, address, origin: "ADMIN", items: [...quantities].map(([productId, quantity]) => ({ productId, quantity })) });
    return NextResponse.json({ orderNumber: order.id, total: order.amount, message: "Manual order saved. Payment is still pending." }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save the order.";
    return NextResponse.json({ error: message }, { status: message.includes("stock") || message.includes("available") ? 409 : 503 });
  }
}
