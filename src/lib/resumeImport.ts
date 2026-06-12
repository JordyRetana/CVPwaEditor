import { ResumeData, emptyResume, normalizeResume } from "./resume";

const sectionWords = [
  "summary",
  "professional summary",
  "resumen",
  "resumen profesional",
  "experience",
  "experiencia",
  "projects",
  "proyectos",
  "education",
  "educacion",
  "educación",
  "skills",
  "habilidades"
];

export function importResumeFromText(rawText: string): ResumeData {
  const text = rawText
    .replace(/\r/g, "\n")
    .replace(
      /(RESUMEN PROFESIONAL|PROFESSIONAL SUMMARY|EXPERIENCIA PROFESIONAL|PROFESSIONAL EXPERIENCE|EXPERIENCIA EN DESARROLLO DE SOFTWARE|PROYECTOS|PROJECTS|EDUCACI[OÓ]N|EDUCATION|HABILIDADES|SKILLS)/gi,
      "\n$1\n"
    )
    .replace(/[ \t]+/g, " ");
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const joined = lines.join("\n");
  const email = joined.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "";
  const phone = joined.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0]?.trim() ?? "";
  const urls = [...joined.matchAll(/https?:\/\/[^\s)]+|(?:www\.)[^\s)]+/gi)].map((match) => match[0]);
  const linkedIn = urls.find((url) => /linkedin/i.test(url)) ?? "";
  const portfolio = urls.find((url) => !/linkedin/i.test(url)) ?? "";
  const fullName = findName(lines, email, phone);
  const location = findLocation(lines);

  return normalizeResume({
    ...emptyResume,
    fullName,
    location,
    phone,
    email,
    portfolio,
    linkedIn,
    professionalSummary: findSection(lines, ["summary", "professional summary", "resumen", "resumen profesional"], [
      "experience",
      "experiencia",
      "projects",
      "proyectos",
      "education",
      "educacion",
      "educación",
      "skills",
      "habilidades"
    ]),
    experience: buildExperience(lines),
    projects: buildProjects(lines),
    education: buildEducation(lines),
    skills: buildSkills(lines)
  });
}

function findName(lines: string[], email: string, phone: string) {
  return (
    lines.find((line) => {
      const lower = line.toLowerCase();
      return (
        line.length >= 5 &&
        line.length <= 70 &&
        !line.includes("@") &&
        !line.includes("http") &&
        !line.includes(phone) &&
        !line.includes(email) &&
        !sectionWords.some((word) => lower === word)
      );
    }) ?? ""
  );
}

function findLocation(lines: string[]) {
  const parts = lines.flatMap((line) => line.split("|").map((part) => part.trim()));
  return parts.find((line) => {
    return (
      /costa rica|san jos[eé]|alajuela|heredia|cartago|remote|remoto/i.test(line) &&
      !line.includes("@") &&
      !/\+?\d[\d\s().-]{7,}\d/.test(line) &&
      line.length < 90
    );
  }) ?? "";
}

function findSection(lines: string[], starts: string[], stops: string[]) {
  const startIndex = lines.findIndex((line) => starts.some((start) => line.toLowerCase() === start));
  if (startIndex < 0) return "";

  const collected: string[] = [];
  for (const line of lines.slice(startIndex + 1)) {
    const lower = line.toLowerCase();
    if (stops.some((stop) => lower === stop)) break;
    if (line.length > 2) collected.push(line);
    if (collected.join(" ").length > 900) break;
  }

  return collected.join(" ").trim();
}

function buildSkills(lines: string[]) {
  const section = findSection(lines, ["skills", "habilidades"], [
    "experience",
    "experiencia",
    "projects",
    "proyectos",
    "education",
    "educacion",
    "educación"
  ]);

  const source = section || lines.filter((line) => /react|next|typescript|javascript|sql|api|\.net|node|css|html/i.test(line)).join(", ");
  return source
    .split(/[,;•|]/)
    .map((value) => value.trim())
    .filter((value) => value.length >= 2 && value.length <= 90)
    .slice(0, 24)
    .map((value) => ({ value }));
}

function buildProjects(lines: string[]) {
  const section = findSection(lines, ["projects", "proyectos"], ["education", "educacion", "educación", "skills", "habilidades"]);
  if (!section) return [];

  const sentences = section.split(/(?:\.\s+|•|\n)/).map((value) => value.trim()).filter(Boolean);
  return [
    {
      title: sentences[0]?.slice(0, 70) || "Proyecto principal",
      role: "Software Developer",
      location: "Proyecto",
      details: sentences.slice(1, 6).map((value) => ({ value }))
    }
  ];
}

function buildExperience(lines: string[]) {
  const section = findSection(lines, ["experience", "experiencia", "professional experience", "experiencia profesional"], [
    "projects",
    "proyectos",
    "education",
    "educacion",
    "educación",
    "skills",
    "habilidades"
  ]);

  if (!section) return [];
  const sentences = section.split(/(?:\.\s+|•|\n)/).map((value) => value.trim()).filter(Boolean);
  return [
    {
      company: "",
      position: sentences[0]?.slice(0, 80) || "Software Developer",
      location: "",
      period: findPeriod(section),
      responsibilities: sentences.slice(1, 7).map((value) => ({ value }))
    }
  ];
}

function buildEducation(lines: string[]) {
  const section = findSection(lines, ["education", "educacion", "educación"], ["skills", "habilidades", "projects", "proyectos"]);
  if (!section) return [];
  return [
    {
      institution: section.split(/[•\n]/)[0]?.trim().slice(0, 100) || "",
      degree: "",
      description: section.slice(0, 220),
      location: "",
      period: findPeriod(section)
    }
  ];
}

function findPeriod(text: string) {
  return text.match(/(?:20\d{2}|19\d{2})(?:\s*[-–]\s*(?:20\d{2}|present|actualidad|current))?/i)?.[0] ?? "";
}
