import { ResumeData } from "./resume";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function contactLine(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean).join(" | ");
}

function bullets(values: string[]) {
  const clean = values.map((value) => value.trim()).filter(Boolean);
  if (clean.length === 0) return "";
  return `<ul>${clean.map((value) => `<li>${escapeHtml(value)}</li>`).join("")}</ul>`;
}

export function buildResumeHtml(resume: ResumeData) {
  const contact1 = contactLine([resume.location, resume.phone, resume.email]);
  const contact2 = contactLine([resume.portfolio, resume.linkedIn]);

  return `
<article class="resume-sheet" aria-label="Curriculum vitae">
  <header class="resume-header">
    <h1>${escapeHtml(resume.fullName || "Nombre completo")}</h1>
    <address>${escapeHtml(contact1)}${contact2 ? `<br />${escapeHtml(contact2)}` : ""}</address>
  </header>
  <section>
    <h2>Resumen profesional</h2>
    <p>${escapeHtml(resume.professionalSummary)}</p>
  </section>
  <section>
    <h2>Experiencia</h2>
    ${resume.experience
      .map(
        (item) => `
      <div class="entry">
        <div class="entry-head">
          <div>
            <h3>${escapeHtml(item.position || item.company)}</h3>
            <p>${escapeHtml(item.company)}</p>
          </div>
          <div class="meta">${escapeHtml(item.location)}<br />${escapeHtml(item.period)}</div>
        </div>
        ${bullets(item.responsibilities.map((line) => line.value))}
      </div>`
      )
      .join("")}
  </section>
  <section>
    <h2>Proyectos</h2>
    ${resume.projects
      .map(
        (item) => `
      <div class="entry">
        <div class="entry-head">
          <div>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.role)}</p>
          </div>
          <div class="meta">${escapeHtml(item.location)}</div>
        </div>
        ${bullets(item.details.map((line) => line.value))}
      </div>`
      )
      .join("")}
  </section>
  <section>
    <h2>Educacion</h2>
    ${resume.education
      .map(
        (item) => `
      <div class="entry">
        <div class="entry-head">
          <div>
            <h3>${escapeHtml(item.degree || item.institution)}</h3>
            <p>${escapeHtml(item.institution)}</p>
            <p>${escapeHtml(item.description)}</p>
          </div>
          <div class="meta">${escapeHtml(item.location)}<br />${escapeHtml(item.period)}</div>
        </div>
      </div>`
      )
      .join("")}
  </section>
  <section>
    <h2>Habilidades</h2>
    ${resume.skills.map((skill) => `<p class="skill">${escapeHtml(skill.value)}</p>`).join("")}
  </section>
</article>`;
}
