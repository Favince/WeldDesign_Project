import { z } from "zod";
import {
  materials,
  projectLocations,
  urgencyLevels,
  weldTypes,
} from "@/lib/estimator";
import { roles } from "@/lib/security";

export const estimateInputSchema = z.object({
  material: z.enum(materials),
  thicknessMm: z.number().min(1).max(80),
  lengthMm: z.number().min(10).max(100000),
  weldType: z.enum(weldTypes),
  quantity: z.number().int().min(1).max(10000),
  location: z.enum(projectLocations),
  urgency: z.enum(urgencyLevels),
});

export const demoAuthSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(roles).default("SISWA"),
});

export const weldScanSchema = z.object({
  fileName: z.string().min(1).max(180).default("scan-upload.jpg"),
  projectId: z.string().min(1).max(80).optional(),
});

export const socialScheduleSchema = z.object({
  platform: z.enum(["Instagram", "TikTok"]),
  caption: z.string().min(1).max(280),
  scheduledAt: z.string().min(1),
});
