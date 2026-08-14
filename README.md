
<p align="center">
  <img src="logo-repo-recyopsapp.svg" alt="RecyOps" width="420">
</p>

<p align="center">
  Cliente web para la gestión integral de una operación de reciclaje: ingresos, entregas, inventario, convenios y equipo de trabajo.
</p>

<!-- Núcleo -->
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-estricto-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Bun](https://img.shields.io/badge/Bun-package%20manager-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh/)

<!-- Ruteo y datos -->
[![React Router](https://img.shields.io/badge/React%20Router-7-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white)](https://reactrouter.com/)
[![Axios](https://img.shields.io/badge/Axios-cliente%20HTTP-5A29E4?style=for-the-badge&logo=axios&logoColor=white)](https://axios-http.com/)

<!-- UI -->
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Radix UI](https://img.shields.io/badge/Radix%20UI-shadcn-161618?style=for-the-badge&logo=radixui&logoColor=white)](https://www.radix-ui.com/)

<!-- Formularios y documentos -->
[![React Hook Form](https://img.shields.io/badge/React%20Hook%20Form-validacion-EC5990?style=for-the-badge&logo=reacthookform&logoColor=white)](https://react-hook-form.com/)
[![Zod](https://img.shields.io/badge/Zod-schemas-3E67B1?style=for-the-badge&logo=zod&logoColor=white)](https://zod.dev/)
[![jsPDF](https://img.shields.io/badge/jsPDF-recibos%20%2F%20reportes-DB2777?style=for-the-badge)](https://github.com/parallax/jsPDF)
[![SheetJS](https://img.shields.io/badge/SheetJS-exportacion%20Excel-217346?style=for-the-badge)](https://sheetjs.com/)

<!-- Los divertidos de ForTheBadge para cerrar el README -->
[![Uses Git](https://forthebadge.com/images/badges/uses-git.svg)](https://git-scm.com/)
[![Built with love](https://forthebadge.com/images/badges/built-with-love.svg)](https://github.com/)

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
