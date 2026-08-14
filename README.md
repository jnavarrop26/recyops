<p align="center">
  <img src="logo-repo-recyopsapp.svg" alt="RecyOps" width="480" />
</p>

<p align="center">
  Cliente web para la gestión integral de una operación de reciclaje: ingresos, entregas, inventario, convenios y equipo de trabajo.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-estricto-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite 6" />
  <img src="https://img.shields.io/badge/Bun-package%20manager-000000?style=flat-square&logo=bun&logoColor=white" alt="Bun" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" />
</p>

---

## Qué es RecyOps

RecyOps es una SPA (React + TypeScript) que sirve de back-office para una operación de reciclaje. El backend es un servicio Spring Boot independiente (repo `recyops-backend`); este repositorio contiene únicamente el frontend.

## Funcionalidades

- **Ingresos** — registro de ingresos de material, historial editable y paginado, recibo imprimible
- **Entregas** — gestión de entregas a proveedores/convenios, con historial y estado
- **Inventario** — stock por bodega, ajustes, mermas y configuración de líneas
- **Convenios y proveedores** — administración de convenios comerciales y catálogo de proveedores
- **Bodegas y materiales** — catálogo de bodegas y materiales gestionados
- **Trabajadores y tareas** — alta/edición de trabajadores y asignación de tareas operativas
- **Reportes** — exportación a PDF y Excel
- **Plataforma** — vista de super admin para configuración multi-tenant

## Stack técnico

| Área | Tecnología |
|---|---|
| Framework / build | React 18, TypeScript, Vite 6, Bun |
| Ruteo | React Router 7 |
| HTTP | Axios (instancia única con refresh automático de sesión) |
| UI | Radix UI / shadcn, Tailwind CSS 4, CSS Modules por vista |
| Formularios y validación | React Hook Form + Zod |
| Documentos | jsPDF / jspdf-autotable (PDF), SheetJS (Excel) |

## Inicio rápido

```bash
bun install
bun run dev      # servidor de desarrollo, proxy /api → localhost:8080
bun run build    # build de producción
```

Configura `VITE_API_URL` si el backend no corre en `localhost:8080` (por defecto usa `/api`).

## Estructura del proyecto

```
src/app/
├── http/            clienteApi.ts — instancia Axios única
├── modules/          un folder por dominio de negocio (auth, ingresos, inventario, ...)
├── shared/           layout (topbar, sidebar) y componentes compartidos
└── components/ui/    shadcn/ui — tratar como librería
```

## Documentación

Arquitectura, inventario de módulos, capa de autenticación/API, convención de schemas de validación y el log de decisiones técnicas están en la **[wiki del proyecto](../../wiki)**.
