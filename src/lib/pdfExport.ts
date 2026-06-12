import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { ResumeData } from "./resume";

const pageWidth = 595.28;
const pageHeight = 841.89;
const margin = 44;
const contentWidth = pageWidth - margin * 2;

export async function buildResumePdf(resume: ResumeData) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${resume.fullName || "CV"} - ATS Resume`);
  pdf.setAuthor(resume.fullName || "CV PWA Editor");
  pdf.setSubject("ATS friendly resume");

  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ctx: PdfContext = {
    pdf,
    page: pdf.addPage([pageWidth, pageHeight]),
    regular,
    bold,
    y: pageHeight - margin
  };

  drawCentered(ctx, resume.fullName || "Nombre completo", 22, bold);
  ctx.y -= 8;
  drawCentered(ctx, [resume.location, resume.phone, resume.email].filter(Boolean).join(" | "), 9, regular, muted);
  if (resume.portfolio || resume.linkedIn) {
    ctx.y -= 12;
    drawCentered(ctx, [resume.portfolio, resume.linkedIn].filter(Boolean).join(" | "), 9, regular, muted);
  }

  section(ctx, "RESUMEN PROFESIONAL");
  paragraph(ctx, resume.professionalSummary || "Agrega un resumen profesional para completar esta seccion.", 10);

  if (resume.experience.length) {
    section(ctx, "EXPERIENCIA");
    for (const item of resume.experience) {
      entry(ctx, item.position || item.company || "Experiencia", item.company, [item.location, item.period].filter(Boolean).join(" |"));
      bullets(ctx, item.responsibilities.map((line) => line.value));
    }
  }

  if (resume.projects.length) {
    section(ctx, "PROYECTOS");
    for (const project of resume.projects) {
      entry(ctx, project.title || "Proyecto", project.role, project.location);
      bullets(ctx, project.details.map((line) => line.value));
    }
  }

  if (resume.education.length) {
    section(ctx, "EDUCACION");
    for (const education of resume.education) {
      entry(ctx, education.degree || education.institution || "Educacion", education.institution, [education.location, education.period].filter(Boolean).join(" |"));
      paragraph(ctx, education.description, 10);
    }
  }

  if (resume.skills.length) {
    section(ctx, "HABILIDADES");
    for (const skill of resume.skills) {
      paragraph(ctx, `• ${skill.value}`, 10, 12);
    }
  }

  return Buffer.from(await pdf.save());
}

type PdfContext = {
  pdf: PDFDocument;
  page: PDFPage;
  regular: PDFFont;
  bold: PDFFont;
  y: number;
};

const black = rgb(0.07, 0.09, 0.13);
const muted = rgb(0.29, 0.33, 0.4);
const rule = rgb(0.56, 0.56, 0.56);

function ensureSpace(ctx: PdfContext, needed: number) {
  if (ctx.y - needed > margin) return;
  ctx.page = ctx.pdf.addPage([pageWidth, pageHeight]);
  ctx.y = pageHeight - margin;
}

function drawCentered(ctx: PdfContext, text: string, size: number, font: PDFFont, color = black) {
  const lines = wrapText(text, font, size, contentWidth);
  for (const line of lines) {
    ensureSpace(ctx, size + 4);
    const width = font.widthOfTextAtSize(line, size);
    ctx.page.drawText(line, {
      x: margin + (contentWidth - width) / 2,
      y: ctx.y,
      size,
      font,
      color
    });
    ctx.y -= size + 3;
  }
}

function section(ctx: PdfContext, title: string) {
  ensureSpace(ctx, 36);
  ctx.y -= 18;
  ctx.page.drawText(title, { x: margin, y: ctx.y, size: 11, font: ctx.bold, color: black });
  ctx.y -= 6;
  ctx.page.drawLine({
    start: { x: margin, y: ctx.y },
    end: { x: pageWidth - margin, y: ctx.y },
    thickness: 0.8,
    color: rule
  });
  ctx.y -= 14;
}

function entry(ctx: PdfContext, title: string, subtitle: string, meta: string) {
  ensureSpace(ctx, 44);
  const startY = ctx.y;
  drawText(ctx, title, 10, ctx.bold, margin, contentWidth - 150, 12);
  if (subtitle) drawText(ctx, subtitle, 10, ctx.regular, margin, contentWidth - 150, 12);
  const leftY = ctx.y;
  ctx.y = startY;
  if (meta) drawRight(ctx, meta, 9, ctx.regular, muted);
  ctx.y = Math.min(leftY, startY - 24);
}

function paragraph(ctx: PdfContext, text: string, size: number, lineHeight = 13) {
  drawText(ctx, text, size, ctx.regular, margin, contentWidth, lineHeight);
}

function bullets(ctx: PdfContext, values: string[]) {
  const clean = values.map((value) => value.trim()).filter(Boolean);
  if (!clean.length) return;
  ctx.y -= 2;
  for (const value of clean) {
    drawText(ctx, `• ${value}`, 10, ctx.regular, margin + 10, contentWidth - 10, 13);
  }
  ctx.y -= 6;
}

function drawText(ctx: PdfContext, text: string, size: number, font: PDFFont, x: number, width: number, lineHeight: number) {
  const lines = wrapText(text, font, size, width);
  for (const line of lines) {
    ensureSpace(ctx, lineHeight + 2);
    ctx.page.drawText(line, { x, y: ctx.y, size, font, color: black });
    ctx.y -= lineHeight;
  }
}

function drawRight(ctx: PdfContext, text: string, size: number, font: PDFFont, color = muted) {
  const maxWidth = 140;
  const lines = wrapText(text, font, size, maxWidth);
  for (const line of lines) {
    const width = font.widthOfTextAtSize(line, size);
    ctx.page.drawText(line, {
      x: pageWidth - margin - width,
      y: ctx.y,
      size,
      font,
      color
    });
    ctx.y -= size + 3;
  }
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = String(text || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (!words.length) return [];

  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}
