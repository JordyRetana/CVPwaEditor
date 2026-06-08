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
  if (!secondParsed.success) {
    throw new Error("La IA respondio demasiado corto o incompleto. Intenta pegar una descripcion de empleo mas detallada.");
  }

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
