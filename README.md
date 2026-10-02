# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

# Dhanvia

Full-stack TypeScript workspace with a React/Vite frontend and an Express API.

## Project structure

```text
frontend/
  index.html
  public/          Static images and icons
  src/             React application and styles
  tsconfig.app.json
  tsconfig.node.json
backend/
  src/             API server, routes, and controllers
  package.json
vite.config.ts
tsconfig.json
```

Frontend source, entry HTML, static assets, and app TypeScript configs are kept in `frontend/`. Shared package scripts and Vite configuration remain at the repository root. Vite proxies `/api` requests to the backend on port `3001`.

## Getting started

Install dependencies:

```sh
npm install
npm install --prefix backend
```

Run the frontend and API in separate terminals:

```sh
npm run dev
npm run dev --prefix backend
```

The frontend runs at `http://localhost:5173`; the API runs at `http://localhost:3001`. Check the API with `GET /api/health`.

## Build and lint

```sh
npm run build
npm run lint
npm run build --prefix backend
```
