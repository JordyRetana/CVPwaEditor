# CV PWA Editor

PWA mobile-first para editar CVs desde iPhone, ajustar el contenido con IA y exportar un CV ATS friendly usando la vista de impresion del navegador.

## Desarrollo local

```powershell
npm install
copy .env.example .env.local
npm run dev
```

Abre `http://localhost:3000`.

## Variables de entorno

- `GROQ_API_KEY`: clave privada de Groq. Debe vivir en Vercel/hosting, nunca en el navegador.
- `LICENSE_API_BASE_URL`: API de licencias existente. Por defecto usa Render.

## Deploy gratis recomendado

1. Sube este repo a GitHub.
2. En Vercel, crea un proyecto nuevo desde el repo.
3. En Environment Variables agrega `GROQ_API_KEY` y `LICENSE_API_BASE_URL`.
4. Deploy.
5. En iPhone abre la URL en Safari, toca compartir y usa `Agregar a pantalla de inicio`.

## Exportar PDF en iPhone

En la pantalla `Vista`, toca `Imprimir / PDF`. En Safari usa compartir o imprimir y guarda como PDF. La plantilla usa HTML limpio, texto seleccionable, secciones semanticas y estilos pensados para ATS.
