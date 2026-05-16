import { NextResponse } from "next/server";
import { scanSamples } from "@/lib/weld-data";
import { weldScanSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = weldScanSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Input scan tidak valid",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const sampleIndex = parsed.data.fileName.length % scanSamples.length;
  const sample = scanSamples[sampleIndex];

  return NextResponse.json({
    fileName: parsed.data.fileName,
    projectId: parsed.data.projectId ?? null,
    detectedType: sample.title,
    quality: sample.result,
    confidence: sample.confidence,
    recommendation: sample.recommendation,
    model: "weld-qc-demo-v1",
    createdAt: new Date().toISOString(),
  });
}
