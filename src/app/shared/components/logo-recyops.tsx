import logoUrl from "@/app/public/icons/logo-1-recyops.svg";

/**
 * Logo principal de RecyOPS (logo-1-recyops.svg).
 * Llena el contenedor que lo envuelve; los contenedores existentes ya usan
 * el aspect-ratio nativo del logo (423 / 464).
 */
export default function LogoRecyops() {
  return (
    <img
      src={logoUrl}
      alt="RecyOPS"
      draggable={false}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
