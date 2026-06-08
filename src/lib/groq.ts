import { AiTailorResult, ResumeData } from "./resume";
import { aiResultSchema, qualityHint } from "./aiValidation";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

type GroqResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

function buildPrompt(resume: ResumeData, jobDescription: string, retryHint = "") {
  return [
    retryHint,
    "Idioma principal: espanol, pero conserva nombres tecnicos en ingles cuando sea natural.",
    "Devuelve SOLO JSON valido con estas llaves exactas:",
    "{ professionalSummary, projects, skills, keywordStrategy, recruiterNotes }",
    "Reglas obligatorias:",
    "- No inventes empresas, titulos academicos, certificaciones, fechas ni metricas falsas.",
    "- Si falta informacion real, redacta de forma honesta usando experiencia de proyectos y capacidades demostrables.",
    "- El resumen debe tener 90-130 palabras, con 4-6 frases sustanciosas, no una linea corta.",
    "- Genera entre 2 y 5 proyectos. Cada proyecto debe tener titulo, rol, ubicacion y 4-6 bullets.",
    "- Cada bullet debe tener 16-28 palabras, orientado a impacto, tecnologias, responsabilidades y ATS.",
    "- Las habilidades deben ser 14-28 frases/categorias utiles, no palabras sueltas.",
    "- Incluye keywordStrategy con palabras clave detectadas del empleo.",
    "- Incluye recruiterNotes con recomendaciones concretas para mejorar el CV.",
    "- Mantiene tono profesional, directo y compatible con Workday, Greenhouse y Lever.",
    "",
    `CV actual JSON:\n${JSON.stringify(resume)}`,
    "",
    `Descripcion del empleo:\n${jobDescription}`
  ]
    .filter(Boolean)
    .join("\n");
}

async function callGroq(apiKey: string, resume: ResumeData, jobDescription: string, retryHint = "") {
  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.45,
      max_tokens: 3600,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Eres un experto senior en optimizacion de CVs ATS. Escribes contenido completo, realista y especifico. Respondes solo JSON valido."
        },
        {
          role: "user",
          content: buildPrompt(resume, jobDescription, retryHint)
        }
      ]
    })
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Groq error ${response.status}: ${text.slice(0, 500)}`);
  }

  const data = JSON.parse(text) as GroqResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq no devolvio contenido.");

  return JSON.parse(content);
}

export async function tailorResume(apiKey: string, resume: ResumeData, jobDescription: string): Promise<AiTailorResult> {
  const first = await callGroq(apiKey, resume, jobDescription);
  const firstParsed = aiResultSchema.safeParse(first);
  if (firstParsed.success) return normalizeAiResult(firstParsed.data);

  const second = await callGroq(apiKey, resume, jobDescription, qualityHint(first));
  const secondParsed = aiResultSchema.safeParse(second);
  if (!secondParsed.success) return normalizeLooseResult(second, resume);

  return normalizeAiResult(secondParsed.data);
}

function normalizeAiResult(result: {
  professionalSummary: string;
  projects: Array<{ title: string; role: string; location: string; details: string[] }>;
  skills: string[];
  keywordStrategy: string[];
  recruiterNotes: string[];
}): AiTailorResult {
  return {
    professionalSummary: result.professionalSummary.trim(),
    projects: result.projects.map((project) => ({
      title: project.title.trim(),
      role: project.role.trim(),
      location: project.location.trim(),
      details: project.details.map((value) => ({ value: value.trim() }))
    })),
    skills: result.skills.map((skill) => skill.trim()),
    keywordStrategy: result.keywordStrategy.map((keyword) => keyword.trim()),
    recruiterNotes: result.recruiterNotes.map((note) => note.trim())
  };
}

function normalizeLooseResult(result: unknown, resume: ResumeData): AiTailorResult {
  const data = result as Partial<{
    professionalSummary: string;
    projects: Array<Partial<{ title: string; role: string; location: string; details: string[] }>>;
    skills: string[];
    keywordStrategy: string[];
    recruiterNotes: string[];
  }>;

  const fallbackSummary = [
    resume.professionalSummary,
    "Perfil orientado a desarrollo full stack, construccion de interfaces claras, integracion de APIs, manejo de datos y entrega de soluciones mantenibles.",
    "Capacidad para adaptar proyectos existentes a requisitos de negocio, mejorar flujos de usuario y documentar decisiones tecnicas con enfoque profesional."
  ]
    .filter(Boolean)
    .join(" ");

  const professionalSummary = expandSummary(data.professionalSummary || fallbackSummary);
  const sourceProjects = data.projects?.length ? data.projects : resume.projects;
  const projects = sourceProjects.slice(0, 5).map((project, index) => {
    const details =
      "details" in project && Array.isArray(project.details)
        ? project.details
        : resume.projects[index]?.details.map((detail) => detail.value) ?? [];

    return {
      title: (project.title || resume.projects[index]?.title || `Proyecto ${index + 1}`).trim(),
      role: (project.role || resume.projects[index]?.role || "Software Developer").trim(),
      location: (project.location || resume.projects[index]?.location || "Proyecto").trim(),
      details: ensureBullets(details)
    };
  });

  if (projects.length === 0) {
    projects.push({
      title: "Proyecto de software",
      role: "Software Developer",
      location: "Proyecto personal",
      details: ensureBullets([])
    });
  }

  const skills = [
    ...(data.skills ?? []),
    ...resume.skills.map((skill) => skill.value),
    "Frontend: React, Next.js, TypeScript, responsive design",
    "Backend: REST APIs, data validation, integrations, deployment",
    "Product quality: ATS-friendly content, usability, maintainability"
  ]
    .map((skill) => skill.trim())
    .filter(Boolean)
    .filter((skill, index, all) => all.indexOf(skill) === index)
    .slice(0, 24);

  return {
    professionalSummary,
    projects,
    skills,
    keywordStrategy: (data.keywordStrategy ?? skills.slice(0, 8)).map((keyword) => keyword.trim()).filter(Boolean),
    recruiterNotes: (data.recruiterNotes ?? [
      "Ajusta el resumen a las palabras clave principales del puesto.",
      "Mantén proyectos con bullets completos y verificables.",
      "Evita inventar métricas, empresas o certificaciones no existentes."
    ]).map((note) => note.trim()).filter(Boolean)
  };
}

function expandSummary(summary: string) {
  const clean = summary.trim();
  if (clean.length >= 280) return clean;

  return `${clean} Experiencia aplicada en desarrollo de aplicaciones web, integracion de servicios, organizacion de informacion y mejora de flujos de usuario. Enfoque en codigo mantenible, interfaces responsivas, documentacion clara y entregas alineadas a requisitos reales del negocio. Capacidad para adaptar proyectos a descripciones de empleo sin inventar datos, reforzando palabras clave tecnicas y logros verificables.`.trim();
}

function ensureBullets(details: string[]) {
  const clean = details.map((detail) => detail.trim()).filter(Boolean);
  const fallback = [
    "Desarrollo de funcionalidades orientadas a resolver necesidades reales de usuario usando estructura clara y componentes mantenibles.",
    "Integracion de datos, validaciones y flujos de trabajo para mejorar confiabilidad, trazabilidad y experiencia general del producto.",
    "Ajuste de interfaces, contenido y comportamiento para mantener una experiencia profesional en pantallas moviles y de escritorio.",
    "Organizacion del codigo y documentacion de decisiones tecnicas para facilitar mejoras futuras y despliegues mas controlados."
  ];

  return [...clean, ...fallback]
    .filter((detail, index, all) => all.indexOf(detail) === index)
    .slice(0, 6)
    .map((value) => ({ value }));
}
