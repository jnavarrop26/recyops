import { Recycle } from "lucide-react";

export function BrandLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const box = size === "lg" ? "size-12" : size === "sm" ? "size-8" : "size-10";
  const icon = size === "lg" ? "size-7" : size === "sm" ? "size-4" : "size-5";
  const title = size === "lg" ? "text-2xl" : "text-lg";

  return (
    <div className="flex items-center gap-3">
      <div className={`${box} rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm`}>
        <Recycle className={icon} />
      </div>
      <div className="leading-tight">
        <div className={`${title} font-semibold tracking-tight text-foreground`}>RecyOPS</div>
        <div className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
          Bodegas de Reciclaje
        </div>
      </div>
    </div>
  );
}
