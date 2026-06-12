import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildResumePdf } from "@/lib/pdfExport";

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
  })
});

export async function POST(request: NextRequest) {
  try {
    const body = requestSchema.parse(await request.json());
    const pdf = await buildResumePdf(body.resume);
    const filename = `${(body.resume.fullName || "CV").replace(/[^\w-]+/g, "_") || "CV"}_ATS.pdf`;

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo exportar el PDF.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
