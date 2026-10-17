import { NextResponse } from "next/server";
import { getProducts } from "@/lib/database";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ products: await getProducts(), source: "database" });
  } catch (error) {
    console.error("Product catalogue unavailable", error);
    return NextResponse.json({ error: "Product catalogue is unavailable." }, { status: 503 });
  }
}
