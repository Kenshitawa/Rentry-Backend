import { NextResponse } from "next/server";
import { createTradeIn } from "@/lib/database";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const customerName = typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
    const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 30) : "";
    const equipmentDetails = typeof body.details === "string" ? body.details.trim().slice(0, 1500) : "";
    if (customerName.length < 2 || phone.length < 8 || equipmentDetails.length < 5) return NextResponse.json({ error: "Please provide your name, phone number, and equipment details." }, { status: 400 });
    const inquiry = await createTradeIn({ name: customerName, phone, details: equipmentDetails });
    return NextResponse.json({ id: inquiry.id, message: "Your trade-in enquiry has been received." }, { status: 201 });
  } catch (error) {
    console.error("Trade-in enquiry could not be saved", error);
    return NextResponse.json({ error: "Trade-in enquiries are temporarily unavailable." }, { status: 503 });
  }
}
