## PowerPoint Studio

A Next.js web app that lets you import existing PowerPoint decks, browse summaries of their slides, and compose new presentations using reusable snippets. Everything runs client-side so your reference decks stay on your machine.

## Features

- Drag-and-drop `.pptx` uploads with automatic slide text extraction
- Reference browser with expandable snippets and quick “Use” actions
- Slide composer with title, narrative, bullets, presenter notes, and reference tracking
- One-click PowerPoint export powered by `pptxgenjs`
- Responsive Tailwind UI designed for desktop workflows

## Local Development

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Production Build

```bash
npm run build
npm start
```

## Tech Stack

- Next.js App Router + React 19
- Tailwind CSS v4 (via `@tailwindcss/postcss`)
- `pptxgenjs` for PowerPoint generation
- `jszip` + `fast-xml-parser` for slide content discovery

## Deployment

Deploy with Vercel:

```bash
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-6bc748c9
```

Once live, verify at `https://agentic-6bc748c9.vercel.app`.
