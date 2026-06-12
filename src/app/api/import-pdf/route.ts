import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { importResumeFromText } from "@/lib/resumeImport";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Sube un archivo PDF valido." }, { status: 400 });
    }

    if (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "El archivo debe ser PDF." }, { status: 400 });
    }

    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "El PDF es muy grande. Usa uno menor a 8 MB." }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const parsed = await pdfParse(bytes);
    const text = parsed.text?.trim();

    if (!text || text.length < 40) {
      return NextResponse.json(
        { error: "No pude leer texto seleccionable en ese PDF. Sube un PDF con texto real, no una imagen escaneada." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      resume: importResumeFromText(text),
      textLength: text.length
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo importar el PDF.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
