"use client";

import { useEffect, useMemo, useState } from "react";
import { PwaInstall } from "@/components/PwaInstall";
import { ResumePreview } from "@/components/ResumePreview";
import {
  AiTailorResult,
  AppState,
  applyAiResult,
  initialState,
  sectionCount,
  starterResume
} from "@/lib/resume";
import { loadState, saveState } from "@/lib/storage";

type Tab = "home" | "edit" | "ai" | "preview";

export default function Home() {
  const [state, setState] = useState<AppState>(initialState);
  const [tab, setTab] = useState<Tab>("home");
  const [jobDescription, setJobDescription] = useState("");
  const [aiResult, setAiResult] = useState<AiTailorResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const loaded = loadState();
    setState(loaded);
    document.documentElement.dataset.theme = loaded.theme;
  }, []);

  useEffect(() => {
    saveState(state);
    document.documentElement.dataset.theme = state.theme;
  }, [state]);

  const counts = useMemo(() => sectionCount(state.resume), [state.resume]);

  function updateResume<K extends keyof AppState["resume"]>(key: K, value: AppState["resume"][K]) {
    setState((current) => ({
      ...current,
      resume: {
        ...current.resume,
        [key]: value
      }
    }));
  }

  async function generateAi() {
    if (jobDescription.trim().length < 120) {
      setStatus("Pega una descripcion de empleo mas completa para que la IA no responda corto.");
      return;
    }

    setBusy(true);
    setStatus("Analizando el empleo y reconstruyendo secciones...");
    try {
      const response = await fetch("/api/ai-tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume: state.resume,
          jobDescription
        })
      });
      const data = (await response.json()) as { result?: AiTailorResult; error?: string };
      if (!response.ok || !data.result) throw new Error(data.error ?? "No se pudo generar.");
      setAiResult(data.result);
      setStatus("Listo. Revisa el resultado antes de aplicarlo.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No se pudo generar el ajuste.");
    } finally {
      setBusy(false);
    }
  }

  function applyAi() {
    if (!aiResult) return;
    setState((current) => ({
      ...current,
      resume: applyAiResult(current.resume, aiResult)
    }));
    setTab("preview");
    setStatus("Cambios aplicados al CV.");
  }

  function printPdf() {
    window.print();
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">PWA para iPhone</p>
          <h1>CV Editor IA</h1>
          <p className="hero-copy">
            Edita tu CV desde el telefono y ajusta el contenido a cada empleo con IA.
          </p>
        </div>
        <button
          className="icon-button"
          onClick={() => setState((current) => ({ ...current, theme: current.theme === "dark" ? "light" : "dark" }))}
          aria-label="Cambiar tema"
        >
          {state.theme === "dark" ? "Claro" : "Noche"}
        </button>
      </section>

      <PwaInstall />

      <nav className="tabs" aria-label="Navegacion principal">
        {[
          ["home", "Inicio"],
          ["edit", "CV"],
          ["ai", "IA"],
          ["preview", "Vista"]
        ].map(([id, label]) => (
          <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id as Tab)}>
            {label}
          </button>
        ))}
      </nav>

      {tab === "home" && (
        <section className="stack">
          <div className="card">
            <h2>Estado</h2>
            <div className="metric-grid">
              <div>
                <span>IA</span>
                <strong>Disponible</strong>
              </div>
              <div>
                <span>Proyectos</span>
                <strong>{counts.projects}</strong>
              </div>
              <div>
                <span>Habilidades</span>
                <strong>{counts.skills}</strong>
              </div>
            </div>
          </div>

          <div className="card">
            <h2>Inicio rapido</h2>
            <p>Carga una plantilla base si quieres empezar sin escribir todo desde cero.</p>
            <button onClick={() => setState((current) => ({ ...current, resume: starterResume }))}>
              Cargar plantilla
            </button>
          </div>
        </section>
      )}

      {tab === "edit" && (
        <section className="stack">
          <div className="card">
            <h2>Datos base</h2>
            <label>
              Nombre completo
              <input value={state.resume.fullName} onChange={(event) => updateResume("fullName", event.target.value)} />
            </label>
            <label>
              Ubicacion
              <input value={state.resume.location} onChange={(event) => updateResume("location", event.target.value)} />
            </label>
            <div className="two">
              <label>
                Telefono
                <input value={state.resume.phone} onChange={(event) => updateResume("phone", event.target.value)} />
              </label>
              <label>
                Correo
                <input value={state.resume.email} onChange={(event) => updateResume("email", event.target.value)} />
              </label>
            </div>
            <label>
              Portfolio
              <input value={state.resume.portfolio} onChange={(event) => updateResume("portfolio", event.target.value)} />
            </label>
            <label>
              LinkedIn
              <input value={state.resume.linkedIn} onChange={(event) => updateResume("linkedIn", event.target.value)} />
            </label>
            <label>
              Resumen profesional
              <textarea
                value={state.resume.professionalSummary}
                onChange={(event) => updateResume("professionalSummary", event.target.value)}
                rows={7}
              />
            </label>
          </div>

          <CollectionEditor
            title="Experiencia"
            onAdd={() =>
              updateResume("experience", [
                ...state.resume.experience,
                { company: "", position: "", location: "", period: "", responsibilities: [{ value: "" }] }
              ])
            }
          >
            {state.resume.experience.map((item, index) => (
              <div className="mini-card" key={index}>
                <input
                  placeholder="Puesto"
                  value={item.position}
                  onChange={(event) => {
                    const next = [...state.resume.experience];
                    next[index] = { ...item, position: event.target.value };
                    updateResume("experience", next);
                  }}
                />
                <input
                  placeholder="Empresa"
                  value={item.company}
                  onChange={(event) => {
                    const next = [...state.resume.experience];
                    next[index] = { ...item, company: event.target.value };
                    updateResume("experience", next);
                  }}
                />
                <textarea
                  placeholder="Responsabilidades, una por linea"
                  value={item.responsibilities.map((line) => line.value).join("\n")}
                  onChange={(event) => {
                    const next = [...state.resume.experience];
                    next[index] = {
                      ...item,
                      responsibilities: event.target.value.split("\n").map((value) => ({ value }))
                    };
                    updateResume("experience", next);
                  }}
                  rows={5}
                />
              </div>
            ))}
          </CollectionEditor>
        </section>
      )}

      {tab === "ai" && (
        <section className="stack">
          <div className="card ai-card">
            <h2>Ajustar con IA</h2>
            <p>
              Pega el texto completo del empleo. La IA va a escribir un resumen mas robusto, proyectos con bullets
              completos y habilidades optimizadas para ATS.
            </p>
            <textarea
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              placeholder="Pega aqui toda la descripcion del trabajo..."
              rows={12}
            />
            <button disabled={busy} onClick={generateAi}>
              {busy ? "Generando..." : "Generar ajuste completo"}
            </button>
          </div>

          {aiResult && (
            <div className="card">
              <h2>Resultado IA</h2>
              <h3>Resumen</h3>
              <p>{aiResult.professionalSummary}</p>
              <h3>Proyectos</h3>
              {aiResult.projects.map((project) => (
                <div className="result-block" key={project.title}>
                  <strong>{project.title}</strong>
                  <ul>{project.details.map((detail) => <li key={detail.value}>{detail.value}</li>)}</ul>
                </div>
              ))}
              <h3>Habilidades</h3>
              <div className="chips">{aiResult.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
              <button onClick={applyAi}>Aplicar al CV</button>
            </div>
          )}
        </section>
      )}

      {tab === "preview" && (
        <section className="stack preview-section">
          <div className="card action-card">
            <h2>Vista ATS</h2>
            <p>Texto seleccionable, estructura limpia y lista para imprimir o guardar como PDF.</p>
            <button onClick={printPdf}>Imprimir / PDF</button>
          </div>
          <ResumePreview resume={state.resume} />
        </section>
      )}

      {status && <div className="toast">{status}</div>}
    </main>
  );
}

function CollectionEditor({
  title,
  onAdd,
  children
}: {
  title: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="section-head">
        <h2>{title}</h2>
        <button onClick={onAdd}>Agregar</button>
      </div>
      <div className="stack">{children}</div>
    </div>
  );
}
