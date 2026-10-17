import {NextResponse} from "next/server";
import {getHouses} from "@/lib/database";
export const dynamic="force-dynamic";
export async function GET(){return NextResponse.json({houses:await getHouses()});}
