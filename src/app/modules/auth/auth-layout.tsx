import { ReactNode } from "react";
import Logo1Recyops from "@/app/shared/components/logo-recyops";
import { RecyOPSIcon } from "@/app/shared/components/recyops-icon";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen w-full flex flex-col bg-background overflow-hidden">

      {/* Logo — esquina superior derecha, colores originales */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute top-0 right-0"
        style={{
          width: "min(400px, 45vw)",
          aspectRatio: "423 / 464",
          transform: "translate(-18%, 8%)",
        }}
      >
        <Logo1Recyops />
      </div>

      {/* Contenido centrado */}
      <main className="relative flex-1 w-full flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative w-full border-t border-border bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p className="font-mono text-xs tracking-wide text-muted-foreground flex items-center gap-2">
            <RecyOPSIcon size={16} variant="default" />
            RecyOPS © 2023 — 2026 · Sistema de Bodegas de Reciclaje
          </p>
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Soporte</a>
            <a href="#" className="hover:text-primary transition-colors">Privacidad</a>
            <a href="#" className="hover:text-primary transition-colors">Términos</a>
            <a href="#" className="hover:text-primary transition-colors">Contacto</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
