export type TextLine = {
  value: string;
};

export type ExperienceItem = {
  company: string;
  position: string;
  location: string;
  period: string;
  responsibilities: TextLine[];
};

export type ProjectItem = {
  title: string;
  role: string;
  location: string;
  details: TextLine[];
};

export type EducationItem = {
  institution: string;
  degree: string;
  description: string;
  location: string;
  period: string;
};

export type ResumeData = {
  fullName: string;
  location: string;
  phone: string;
  email: string;
  portfolio: string;
  linkedIn: string;
  professionalSummary: string;
  experience: ExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
  skills: TextLine[];
};

export type AppState = {
  resume: ResumeData;
  theme: "dark" | "light";
};

export type AiTailorResult = {
  professionalSummary: string;
  projects: ProjectItem[];
  skills: string[];
  keywordStrategy: string[];
  recruiterNotes: string[];
};

export const emptyResume: ResumeData = {
  fullName: "",
  location: "",
  phone: "",
  email: "",
  portfolio: "",
  linkedIn: "",
  professionalSummary: "",
  experience: [],
  projects: [],
  education: [],
  skills: []
};

export const initialState: AppState = {
  resume: emptyResume,
  theme: "dark"
};

export const starterResume: ResumeData = {
  fullName: "",
  location: "",
  phone: "",
  email: "",
  portfolio: "",
  linkedIn: "",
  professionalSummary:
    "Desarrollador de software enfocado en construir aplicaciones web modernas, interfaces claras y soluciones orientadas a resultados. Experiencia trabajando con APIs, bases de datos, componentes reutilizables y flujos de usuario completos. Capacidad para aprender rapido, documentar decisiones tecnicas y entregar productos funcionales con atencion al detalle.",
  experience: [
    {
      company: "",
      position: "Software Developer",
      location: "",
      period: "",
      responsibilities: [
        { value: "Desarrolle funcionalidades frontend y backend para mejorar procesos internos y experiencias de usuario." },
        { value: "Integre APIs, validaciones y manejo de datos para crear flujos mas confiables y mantenibles." },
        { value: "Colabore en pruebas, ajustes visuales y mejoras de rendimiento en aplicaciones web." }
      ]
    }
  ],
  projects: [
    {
      title: "CV Desktop Editor",
      role: "Full Stack Developer",
      location: "Proyecto personal",
      details: [
        { value: "Construccion de una aplicacion para importar, editar y exportar curriculums con formato profesional y ATS friendly." },
        { value: "Implementacion de instaladores, actualizaciones, exportacion PDF y panel administrativo para manejar entregas a clientes." },
        { value: "Integracion de servicios externos y persistencia local para mejorar la experiencia del usuario final." }
      ]
    }
  ],
  education: [],
  skills: [
    { value: "Frontend: React, Next.js, HTML, CSS, TypeScript" },
    { value: "Backend: APIs REST, Node.js, .NET, bases de datos relacionales" },
    { value: "Herramientas: Git, GitHub, Vercel, Render, Supabase" }
  ]
};

export function normalizeResume(resume: ResumeData): ResumeData {
  return {
    ...emptyResume,
    ...resume,
    experience: resume.experience ?? [],
    projects: resume.projects ?? [],
    education: resume.education ?? [],
    skills: resume.skills ?? []
  };
}

export function applyAiResult(resume: ResumeData, result: AiTailorResult): ResumeData {
  return normalizeResume({
    ...resume,
    professionalSummary: result.professionalSummary.trim(),
    projects: result.projects
      .filter((project) => project.title.trim())
      .slice(0, 5)
      .map((project) => ({
        ...project,
        details: project.details.filter((detail) => detail.value.trim()).slice(0, 6)
      })),
    skills: result.skills
      .filter((skill) => skill.trim())
      .slice(0, 24)
      .map((skill) => ({ value: skill.trim() }))
  });
}

export function sectionCount(resume: ResumeData) {
  return {
    experience: resume.experience.length,
    projects: resume.projects.length,
    education: resume.education.length,
    skills: resume.skills.length
  };
}
