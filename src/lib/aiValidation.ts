import { z } from "zod";

export const aiProjectSchema = z.object({
  title: z.string().min(2),
  role: z.string().min(2),
  location: z.string().default(""),
  details: z.array(z.string().min(20)).min(3).max(7)
});

export const aiResultSchema = z.object({
  professionalSummary: z.string().min(280).max(1000),
  projects: z.array(aiProjectSchema).min(1).max(5),
  skills: z.array(z.string().min(8)).min(10).max(28),
  keywordStrategy: z.array(z.string()).min(5).max(14),
  recruiterNotes: z.array(z.string()).min(3).max(8)
});

export function qualityHint(result: unknown) {
  const parsed = aiResultSchema.safeParse(result);
  if (parsed.success) return "";

  return [
    "The previous response was too short or missed required structure.",
    "Expand the professional summary to 90-130 words.",
    "Return 2-5 projects with 4-6 strong bullet statements each.",
    "Return 14-28 skills grouped into useful ATS keyword phrases.",
    "Keep all claims grounded in the candidate resume."
  ].join(" ");
}
