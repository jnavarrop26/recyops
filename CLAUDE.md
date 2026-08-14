# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run dev      # start dev server (proxies /api → localhost:8080)
bun run build    # production build
```

No test runner is configured. Type-checking is implicit via Vite/TypeScript during build.

## Architecture

RecyOPS is a React 18 SPA (Vite + TypeScript) for managing a recycling operation. The backend is a separate Spring Boot service; this repo is frontend only.


```
src/app/
├── http/                   clienteApi.ts
├── modules/
│   ├── auth/               login, restablecer, auth-layout + authApi, authSchema
│   ├── bodega/             vistas, detalle, formulario, ui + bodegasApi, bodegaSchema
│   ├── configuracion/      vista de configuración general
│   ├── convenios/          vista, formulario + conveniosApi, convenioSchema
│   ├── entregas/           vista, formulario, detalle, historial, chip de estado + entregasApi, entregaSchema
│   ├── home/               home-view + dashboardApi
│   ├── ingresos/           vista, formulario, historial, chip de estado, recibo imprimible + ingresosApi, ingresoSchema
│   ├── inventario/         vistas, detalle, modales (ajuste, merma, configurar línea), indicador de stock + inventarioApi, ajusteSchema, mermaSchema, lineaConfigurarSchema
│   ├── logs/               vista + logsApi
│   ├── materiales/         vista, formulario + materialesApi, materialSchema
│   ├── platform/           vista de super admin de plataforma + plataformaApi, plataformaSchema
│   ├── proveedores/        vista, formulario + proveedoresApi, proveedorSchema
│   ├── reportes/           vista de reportes (PDF/Excel)
│   ├── tareas/             vistas, detalle, formulario, mis-tareas + tareasApi, tareaSchema
│   └── trabajadores/       vistas, registrar, editar + trabajadoresApi, trabajadorSchema
├── shared/
│   ├── layout/             dashboard-layout, sidebar, topbar, ruta-admin
│   └── components/         brand-logo, logo, icons, page, pages, estrellas
└── components/ui/          shadcn/ui — componentes atómicos, tratar como librería
```

Cada módulo con formularios trae un `<modulo>Schema.ts` con validaciones Zod que replican las reglas del backend (`@NotBlank`, `@Size`, etc. de los DTOs Spring). Si el backend cambia una regla de validación, el schema correspondiente debe actualizarse manualmente.


### Entry point and routing

`src/main.tsx` → `src/app/App.tsx` → `src/app/routes.tsx`

All authenticated pages are children of `DashboardLayout`, which renders `Topbar` + `Sidebar` + `<Outlet>`. Authentication is checked in `DashboardLayout` by reading `localStorage.getItem("sicofar_token")`; unauthenticated users are redirected to `/`.

Two roles exist: **ADMIN** and regular workers. `RutaAdmin` wraps admin-only routes and redirects non-admins to `/ingreso`.

### API layer

`src/app/servicios/clienteApi.ts` is the single Axios instance used by all API modules. It:
- Reads `VITE_API_URL` env var (falls back to `/api`, proxied to `localhost:8080` in dev)
- Attaches the JWT from `localStorage.getItem("sicofar_token")` on every request except `/auth/login`
- Automatically refreshes the session on 401 using `sicofar_refresh`, with a single in-flight deduplication guard
- Clears all `sicofar_*` localStorage keys and redirects to `/` if refresh also fails

All domain API modules (`authApi.ts`, `ingresosApi.ts`, etc.) import `clienteApi` and expose typed async functions.

Session keys: `sicofar_token`, `sicofar_refresh`, `sicofar_rol`, `sicofar_nombre`, `sicofar_username`.

### Styling

Tailwind CSS 4 (via `@tailwindcss/vite`) plus **CSS Modules** for per-component styles. Each view that needs scoped CSS has a `<name>.module.css` file alongside it. Global resets and custom spinner styles are in `src/styles/`.

`src/app/components/ui/` contains shadcn/ui components (Radix UI wrappers) — treat these as a library; avoid editing them unless upgrading shadcn.

### Path alias

`@` maps to `src/` (configured in `vite.config.ts`).

### Document generation

- PDF reports: `jspdf` + `jspdf-autotable`
- Excel exports: `xlsx` (SheetJS)
- Printable receipts: `src/app/components/recibo-ingreso.ts` generates HTML opened via `window.print()`


### Springboot Comunication

All integratioon with backend are in /home/janp/Projects/recyops-backend



### Graphify for know on project

Review GRAPH_REPORT.md for have bets idea or graphify-out/