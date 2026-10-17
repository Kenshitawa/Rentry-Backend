import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request:NextRequest) {
  const clientId=process.env.GOOGLE_CLIENT_ID;
  if(!clientId) return NextResponse.redirect(new URL("/?auth=google-not-configured",request.url));
  const state=randomBytes(24).toString("base64url");
  const redirectUri=`${(process.env.FRONTEND_URL||request.nextUrl.origin).replace(/\/$/,"")}/api/auth/google/callback`;
  const url=new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id",clientId);url.searchParams.set("redirect_uri",redirectUri);url.searchParams.set("response_type","code");url.searchParams.set("scope","openid email profile");url.searchParams.set("state",state);url.searchParams.set("prompt","select_account");
  const response=NextResponse.redirect(url);response.cookies.set("rentry_google_state",state,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:600});return response;
}
