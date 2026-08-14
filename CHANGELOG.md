# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto usa [Versionamiento Semántico](https://semver.org/lang/es/).

Mientras la versión sea `0.x.y`, la API se considera en desarrollo inicial:
puede haber cambios incompatibles en un `MINOR` sin que eso implique un `MAJOR`.

## [Sin publicar]

## [0.1.0] - 2026-08-14

Primer release documentado del cliente web. Reúne el trabajo realizado hasta la fecha.

### Added

- Estructura inicial del cliente web (React 18 + Vite + TypeScript), organizada
  por módulos de dominio.
- Reestructuración por módulos y vista de super admin para provisionamiento
  de plataforma.
- Rediseño del shell de la aplicación, historial de ingresos editable y capa
  de cliente HTTP (`clienteApi.ts`).
- Validación de formularios con Zod + react-hook-form: cada módulo con
  formularios trae su `<modulo>Schema.ts`, que replica en el cliente las
  reglas de validación del backend (`@NotBlank`, `@Size`, etc. de los DTOs Spring).

### Fixed

- Adaptación del frontend al endurecimiento de seguridad del backend (ADR-002).

[Sin publicar]: https://github.com/jnavarrop26/recyops/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/jnavarrop26/recyops/releases/tag/v0.1.0
