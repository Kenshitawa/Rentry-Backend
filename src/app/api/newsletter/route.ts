import { NextResponse } from "next/server";
import { subscribe } from "@/lib/database";

export async function POST(request:Request) {
  try { const body=await request.json();const email=typeof body.email==="string"?body.email.trim().toLowerCase().slice(0,254):"";if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return NextResponse.json({error:"Enter a valid email address."},{status:400});const created=await subscribe(email);return NextResponse.json({message:created?"You're subscribed to Rentry updates.":"This email is already subscribed."},{status:created?201:200}); }
  catch(error){console.error("Newsletter subscription failed",error);return NextResponse.json({error:"Subscription is temporarily unavailable."},{status:503});}
}
