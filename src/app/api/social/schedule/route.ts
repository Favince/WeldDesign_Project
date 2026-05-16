import { NextResponse } from "next/server";
import { socialPosts } from "@/lib/weld-data";
import { socialScheduleSchema } from "@/lib/validators";

export async function GET() {
  return NextResponse.json({
    posts: socialPosts,
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = socialScheduleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Jadwal post tidak valid",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      post: parsed.data,
      status: "scheduled",
      createdAt: new Date().toISOString(),
    },
    { status: 201 },
  );
}
