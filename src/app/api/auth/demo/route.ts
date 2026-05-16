import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { demoAuthSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = demoAuthSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Credential tidak valid",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const token = jwt.sign(
    {
      sub: parsed.data.email,
      role: parsed.data.role,
      aud: "weld-design-production",
    },
    process.env.JWT_SECRET ?? "development-secret-change-me",
    {
      expiresIn: "30m",
      issuer: "krisavaaerovin.my.id",
    },
  );

  return NextResponse.json({
    user: {
      email: parsed.data.email,
      role: parsed.data.role,
      twoFactorRequired: parsed.data.role === "ADMIN",
    },
    session: {
      token,
      expiresIn: "30m",
      timeoutPolicy: "idle",
    },
    passwordHashPreview: `${passwordHash.slice(0, 12)}...`,
  });
}
