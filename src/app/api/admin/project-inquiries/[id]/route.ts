import {NextRequest,NextResponse} from "next/server";
import {isAdminRequest} from "@/lib/admin-auth";
import {updateProjectInquiryStatus} from "@/lib/database";
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){if(!isAdminRequest(request))return NextResponse.json({error:"Admin access required."},{status:401});const{status}=await request.json();if(!["NEW","CONTACTED","QUOTED","ACCEPTED","CLOSED"].includes(status))return NextResponse.json({error:"Invalid status."},{status:400});return await updateProjectInquiryStatus((await params).id,status)?NextResponse.json({ok:true}):NextResponse.json({error:"Enquiry not found."},{status:404});}
