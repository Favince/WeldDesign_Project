import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    name: "WeldDesign Production",
    domain: "krisavaaerovin.my.id",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
