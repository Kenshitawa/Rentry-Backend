import { NextResponse } from "next/server";
import { completeMpesaPayment, getOrderByCheckout } from "@/lib/database";
import { verifyMpesaPayment } from "@/lib/mpesa";

export async function POST(request:Request) {
  try {
    const body=await request.json();const callback=body?.Body?.stkCallback;const checkoutId=callback?.CheckoutRequestID;
    if(typeof checkoutId!=="string")return NextResponse.json({ResultCode:1,ResultDesc:"Invalid callback."},{status:400});
    const order=await getOrderByCheckout(checkoutId);if(!order)return NextResponse.json({ResultCode:0,ResultDesc:"Accepted."});
    // Treat callbacks as a wake-up signal; confirm against Daraja's transaction query before changing payment state.
    const verified=await verifyMpesaPayment({checkoutRequestId:checkoutId,amount:Number(order.amount)});
    const resultCode=Number(verified.ResultCode);
    if(resultCode===0){const meta=callback.CallbackMetadata?.Item as {Name?:string;Value?:string|number}[]|undefined;const amount=Number(meta?.find(item=>item.Name==="Amount")?.Value);const phone=String(meta?.find(item=>item.Name==="PhoneNumber")?.Value??"");const receipt=meta?.find(item=>item.Name==="MpesaReceiptNumber")?.Value;if(amount!==Math.round(Number(order.amount))||phone!==order.phone)return NextResponse.json({ResultCode:1,ResultDesc:"Payment details did not match the order."},{status:400});await completeMpesaPayment(checkoutId,0,receipt?String(receipt):undefined);}
    else if(resultCode!==undefined&&!Number.isNaN(resultCode))await completeMpesaPayment(checkoutId,resultCode);
    return NextResponse.json({ResultCode:0,ResultDesc:"Accepted."});
  } catch(error){console.error("M-Pesa callback processing failed",error);return NextResponse.json({ResultCode:1,ResultDesc:"Callback processing failed."},{status:500});}
}
