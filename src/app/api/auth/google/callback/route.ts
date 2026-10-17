import { OAuth2Client } from "google-auth-library";
import { NextRequest, NextResponse } from "next/server";
import { createCustomer } from "@/lib/database";

export async function GET(request:NextRequest) {
  const frontendUrl=(process.env.FRONTEND_URL||request.nextUrl.origin).replace(/\/$/,"");
  const code=request.nextUrl.searchParams.get("code"),state=request.nextUrl.searchParams.get("state"),saved=request.cookies.get("rentry_google_state")?.value;
  const fail=(reason:string)=>{const response=NextResponse.redirect(new URL(`/?auth=${reason}`,frontendUrl));response.cookies.delete("rentry_google_state");return response;};
  if(!code||!state||!saved||state!==saved)return fail("google-error");
  const clientId=process.env.GOOGLE_CLIENT_ID,clientSecret=process.env.GOOGLE_CLIENT_SECRET;
  if(!clientId||!clientSecret)return fail("google-not-configured");
  try {
    const oauth=new OAuth2Client(clientId,clientSecret,`${frontendUrl}/api/auth/google/callback`);
    const {tokens}=await oauth.getToken(code);if(!tokens.id_token)return fail("google-error");
    const ticket=await oauth.verifyIdToken({idToken:tokens.id_token,audience:clientId});const profile=ticket.getPayload();
    if(!profile?.sub||!profile.email||!profile.email_verified)return fail("google-error");
    const session=await createCustomer({id:profile.sub,email:profile.email,name:profile.name||profile.email,picture:profile.picture});
    const response=NextResponse.redirect(new URL("/?signed-in=1",frontendUrl));response.cookies.delete("rentry_google_state");response.cookies.set("rentry_customer",session.token,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:30*86400});return response;
  } catch(error) { console.error("Google sign-in failed",error);return fail("google-error"); }
}
