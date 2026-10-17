import { NextResponse } from "next/server";
import { createOrder, failOrderAndRestock, getCustomer, setOrderCheckout } from "@/lib/database";
import { requestMpesaPayment } from "@/lib/mpesa";
import { NextRequest } from "next/server";

type RequestedItem = { productId?: unknown; quantity?: unknown };
export async function POST(request: NextRequest) {
  const token=request.cookies.get("rentry_customer")?.value;const customer=token?await getCustomer(token):null;
  if(!customer)return NextResponse.json({error:"Sign in with Google before checkout."},{status:401});
  let body: { phone?: unknown; address?: unknown; items?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const phone = typeof body.phone === "string" ? body.phone.replace(/[\s()+-]/g, "") : "";
  const address = typeof body.address === "string" ? body.address.trim().slice(0, 500) : "";
  const items = Array.isArray(body.items) ? body.items as RequestedItem[] : [];
  if (!/^254[17]\d{8}$/.test(phone) || address.length < 4 || !items.length || items.length > 30) {
    return NextResponse.json({ error: "Enter a valid Kenyan phone number, delivery address, and cart items." }, { status: 400 });
  }
  const quantities = new Map<string, number>();
  for (const item of items) {
    if (typeof item.productId !== "string" || !Number.isInteger(item.quantity) || Number(item.quantity) < 1 || Number(item.quantity) > 50) return NextResponse.json({ error: "Invalid cart item." }, { status: 400 });
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + Number(item.quantity));
  }
  try {
    const order = await createOrder({ name:customer.name, phone, address, customerId:customer.id, items: [...quantities].map(([productId, quantity]) => ({ productId, quantity })) });
    try { const payment=await requestMpesaPayment({orderId:order.id,phone,amount:order.amount});await setOrderCheckout(order.id,payment.checkoutRequestId,payment.merchantRequestId);return NextResponse.json({orderNumber:order.id,total:order.amount,paymentStatus:"PENDING",message:payment.customerMessage},{status:201}); }
    catch(error){await failOrderAndRestock(order.id);throw error;}
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to place order.";
    const status = message.includes("stock") || message.includes("available") ? 409 : message.includes("Sign in")?401:503;
    return NextResponse.json({ error: message }, { status });
  }
}
