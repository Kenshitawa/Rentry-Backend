import { NextRequest,NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { saveProduct } from "@/lib/database";

export async function POST(request:NextRequest) {
  if(!isAdminRequest(request))return NextResponse.json({error:"Admin access required."},{status:401});
  try {
    const body=await request.json();
    const name=typeof body.name==="string"?body.name.trim().slice(0,140):"";const brand=typeof body.brand==="string"?body.brand.trim().slice(0,80):"";const category=typeof body.category==="string"?body.category.trim().slice(0,80):"";const description=typeof body.description==="string"?body.description.trim().slice(0,2000):"";const image=typeof body.image==="string"?body.image.trim().slice(0,1500):"";const imageCredit=typeof body.imageCredit==="string"?body.imageCredit.trim().slice(0,400):"";const price=Number(body.price),stock=Number(body.stock);const specs=Array.isArray(body.specs)?body.specs.filter((s:unknown)=>typeof s==="string").slice(0,20):[];
    if(name.length<2||!brand||!category||description.length<5||!Number.isFinite(price)||price<=0||!Number.isInteger(stock)||stock<0||!/^https:\/\//.test(image))return NextResponse.json({error:"Enter a name, brand, category, description, positive price, non-negative stock, and a secure image URL."},{status:400});
    const product=await saveProduct({name,brand,category,description,price,stock,image,imageCredit,specs});return NextResponse.json({product},{status:201});
  }catch(error){console.error("Product could not be saved",error);return NextResponse.json({error:"Could not save the product."},{status:400});}
}
