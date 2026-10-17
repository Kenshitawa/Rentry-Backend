import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

export function isAdminRequest(request: NextRequest) {
  const secret = process.env.ADMIN_API_KEY;
  if (!secret) return false;
  const supplied = request.cookies.get("rentry_admin")?.value ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const expected = Buffer.from(secret);
  const actual = Buffer.from(supplied);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
