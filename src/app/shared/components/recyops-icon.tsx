import { TRAZOS_RECYOPS } from "@/app/shared/components/recyops-icon-paths";

interface RecyOPSIconProps {
  size?: number;
  /** "default" usa los colores originales del diseño (fondo claro).
   *  "light" usa blancos/verdes claros para fondos oscuros (sidebar). */
  variant?: "default" | "light";
  className?: string;
}

/** Isotipo de RecyOPS (favicon-recyops.svg) con soporte de recoloreado por variante. */
export function RecyOPSIcon({ size = 24, variant = "default", className }: RecyOPSIconProps) {
  const cuerpo1 = variant === "light" ? "#4ade80" : "#178E3B";
  const cuerpo2 = variant === "light" ? "#86efac" : "#2FA65B";
  const contorno = variant === "light" ? "rgba(255,255,255,0.88)" : "#203529";
  const colores = [cuerpo1, cuerpo2, contorno, contorno, contorno, contorno];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {TRAZOS_RECYOPS.map((trazo, indice) => (
        <path key={indice} d={trazo} fill={colores[indice]} />
      ))}
    </svg>
  );
}
