import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { tailorResume } from "@/lib/groq";

export const runtime = "nodejs";

const requestSchema = z.object({
  resume: z.object({
    fullName: z.string(),
    location: z.string(),
    phone: z.string(),
    email: z.string(),
    portfolio: z.string(),
    linkedIn: z.string(),
    professionalSummary: z.string(),
    experience: z.array(z.any()),
    projects: z.array(z.any()),
    education: z.array(z.any()),
    skills: z.array(z.any())
  }),
  jobDescription: z.string().min(120, "Pega una descripcion de empleo mas completa.")
});

export async function POST(request: NextRequest) {
  try {
    const body = requestSchema.parse(await request.json());

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY no esta configurada en el servidor." },
        { status: 500 }
      );
    }

    const result = await tailorResume(apiKey, body.resume, body.jobDescription);
    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo generar el ajuste.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
