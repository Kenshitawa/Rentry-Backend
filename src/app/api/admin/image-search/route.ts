import { NextRequest,NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";

export async function GET(request:NextRequest) {
  if(!isAdminRequest(request))return NextResponse.json({error:"Admin access required."},{status:401});
  const query=request.nextUrl.searchParams.get("q")?.trim().slice(0,100);if(!query)return NextResponse.json({images:[]});
  try {
    const response=await fetch(`https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page_size=18&license=cc0,pdm,by,by-sa`,{next:{revalidate:300}});
    if(!response.ok)throw new Error(`Openverse returned ${response.status}`);
    const data=await response.json();const images=(data.results??[]).map((item:{id:string;title?:string;url:string;thumbnail?:string;creator?:string;license?:string;license_version?:string;foreign_landing_url?:string})=>({id:item.id,title:item.title||"Untitled image",url:item.url,thumbnail:item.thumbnail||item.url,creator:item.creator||"Unknown creator",license:`${item.license||""} ${item.license_version||""}`.trim(),source:item.foreign_landing_url||item.url}));
    return NextResponse.json({images});
  }catch(error){console.error("Image search unavailable",error);return NextResponse.json({error:"Image search is temporarily unavailable. You can paste an HTTPS image URL instead."},{status:503});}
}
