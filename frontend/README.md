# frontend/

Vite + React + TypeScript (PWA). Architektur siehe `docs/ARCHITECTURE.md`.

## Voraussetzungen

Node 22 über nvm: im Repo-Root bzw. hier `nvm use` (liest `../.nvmrc`).
Installationsskripte von Abhängigkeiten sind per `.npmrc` blockiert (`ignore-scripts=true`).

## Befehle

| Befehl | Zweck |
|---|---|
| `npm ci` | Abhängigkeiten exakt nach `package-lock.json` installieren |
| `npm run dev` | Dev-Server auf http://localhost:5173, `/api` wird an DDEV (`https://primed.ddev.site`) weitergeleitet; anderes Ziel über `PRIMED_API_TARGET` |
| `npm run check` | Typecheck, ESLint, Prettier-Prüfung, Tests |
| `npm test` | Vitest einmalig |
| `npm run build` | Produktions-Build nach `dist/` |
