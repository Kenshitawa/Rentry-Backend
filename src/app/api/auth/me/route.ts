import { NextRequest, NextResponse } from "next/server";
import { deleteCustomerSession, getCustomer, getCustomerOrders } from "@/lib/database";

export async function GET(request:NextRequest) {
  const token=request.cookies.get("rentry_customer")?.value;const customer=token?await getCustomer(token):null;
  if(!customer)return NextResponse.json({customer:null});
  const orders=await getCustomerOrders(customer.id);
  return NextResponse.json({customer,orders});
}
export async function DELETE(request:NextRequest) {
  const token=request.cookies.get("rentry_customer")?.value;if(token)await deleteCustomerSession(token);
  const response=NextResponse.json({ok:true});response.cookies.delete("rentry_customer");return response;
}
