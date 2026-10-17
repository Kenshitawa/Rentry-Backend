import {NextRequest,NextResponse} from "next/server";
import {getProduct} from "@/lib/database";
export const dynamic="force-dynamic";
export async function GET(_request:NextRequest,{params}:{params:Promise<{id:string}>}){const product=await getProduct((await params).id);return product?NextResponse.json({product}):NextResponse.json({error:"Product not found."},{status:404});}
