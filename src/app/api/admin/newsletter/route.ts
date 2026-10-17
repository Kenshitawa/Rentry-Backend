import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { subscribe } from "@/lib/database";

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Sign in to add a subscriber." }, { status: 401 });
  let body: { email?: unknown; consentConfirmed?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (body.consentConfirmed !== true) return NextResponse.json({ error: "Confirm that this person agreed to receive newsletter emails." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  const added = await subscribe(email, "ADMIN");
  return NextResponse.json({ message: added ? "Subscriber added." : "That email is already subscribed." }, { status: added ? 201 : 200 });
}
