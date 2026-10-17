import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { createCustomerContact } from "@/lib/database";

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Admin access required." }, { status: 401 });
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 100) : "";
    const email = typeof body.email === "string" ? body.email.trim().slice(0, 160).toLowerCase() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 25) : "";
    const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 500) : "";
    if (name.length < 2 || (!email && !phone)) return NextResponse.json({ error: "Add a name and at least an email address or phone number." }, { status: 400 });
    const contact = await createCustomerContact({ name, email, phone, notes });
    return NextResponse.json({ contact }, { status: 201 });
  } catch { return NextResponse.json({ error: "Could not save customer contact." }, { status: 400 }); }
}
