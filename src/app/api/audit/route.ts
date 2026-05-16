import { NextResponse } from "next/server";
import { auditTrail } from "@/lib/weld-data";

export async function GET() {
  return NextResponse.json({
    events: auditTrail,
    retentionDays: 365,
    exportedAt: new Date().toISOString(),
  });
}
