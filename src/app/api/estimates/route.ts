import { NextResponse } from "next/server";
import { calculateWeldEstimate } from "@/lib/estimator";
import { estimateInputSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = estimateInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Input estimasi tidak valid",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const estimate = calculateWeldEstimate(parsed.data);

  return NextResponse.json({
    estimate,
    audit: {
      action: "estimate:create",
      at: new Date().toISOString(),
      status: "draft",
    },
  });
}
