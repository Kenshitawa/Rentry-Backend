import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

export async function POST(request: NextRequest) {
  const secret = process.env.ADMIN_API_KEY;
  if (!secret) return NextResponse.json({ error: "Set ADMIN_API_KEY in .env.local before signing in." }, { status: 503 });
  let body: { key?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const key = typeof body.key === "string" ? body.key : "";
  const expected = Buffer.from(secret), actual = Buffer.from(key);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return NextResponse.json({ error: "That admin key is not correct." }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set("rentry_admin", secret, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 60 * 60 * 12 });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("rentry_admin", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
  return response;
}
