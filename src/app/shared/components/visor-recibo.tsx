import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ExternalLink, Printer, RotateCw } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Skeleton } from "@/app/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";

interface VisorReciboProps {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  titulo: string;
  /** Devuelve el documento HTML completo del recibo; se invoca al abrir. */
  cargarHtml: (signal: AbortSignal) => Promise<string>;
  onAbrirEnPestana: () => void;
}

type EstadoVisor =
  | { tipo: "cargando" }
  | { tipo: "error" }
  | { tipo: "listo"; html: string };

// El iframe va sin allow-scripts: el botón inline de la plantilla no funcionaría,
// así que se oculta y la impresión se lanza desde el pie del diálogo.
const ESTILO_VISTA_PREVIA = "<style>.acciones{display:none!important}</style>";

function prepararVistaPrevia(html: string) {
  return html.includes("</head>")
    ? html.replace("</head>", `${ESTILO_VISTA_PREVIA}</head>`)
    : ESTILO_VISTA_PREVIA + html;
}

const ALTO_AREA = "h-[min(70dvh,880px)]";

/**
 * Vista previa del recibo dentro de la app (sin depender de ventanas
 * emergentes), con impresión directa y opción de abrirlo en otra pestaña.
 */
export function VisorRecibo({
  abierto,
  onOpenChange,
  titulo,
  cargarHtml,
  onAbrirEnPestana,
}: VisorReciboProps) {
  const [estado, setEstado] = useState<EstadoVisor>({ tipo: "cargando" });
  const [iframeListo, setIframeListo] = useState(false);
  const [intento, setIntento] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Última versión del cargador sin volver a pedir el recibo en cada render del padre.
  const cargarRef = useRef(cargarHtml);
  useLayoutEffect(() => {
    cargarRef.current = cargarHtml;
  });

  useEffect(() => {
    if (!abierto) return;
    const controlador = new AbortController();
    setEstado({ tipo: "cargando" });
    setIframeListo(false);
    cargarRef
      .current(controlador.signal)
      .then((html) => {
        if (!controlador.signal.aborted) setEstado({ tipo: "listo", html: prepararVistaPrevia(html) });
      })
      .catch(() => {
        if (!controlador.signal.aborted) setEstado({ tipo: "error" });
      });
    return () => controlador.abort();
  }, [abierto, intento]);

  function imprimir() {
    try {
      iframeRef.current?.contentWindow?.print();
    } catch {
      onAbrirEnPestana();
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95dvh] max-w-[calc(100%-1rem)] gap-3 p-4 sm:max-w-3xl sm:p-6">
        <DialogHeader className="pr-6">
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>Vista previa del recibo listo para imprimir o guardar en PDF.</DialogDescription>
        </DialogHeader>

        <div className={`${ALTO_AREA} overflow-hidden rounded-md border bg-muted`} aria-busy={estado.tipo === "cargando"}>
          {estado.tipo === "cargando" && (
            <div className="flex h-full flex-col gap-3 p-4" role="status">
              <span className="sr-only">Generando vista previa del recibo…</span>
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="w-full flex-1" />
            </div>
          )}
          {estado.tipo === "error" && (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center" role="alert">
              <p className="text-sm text-muted-foreground">
                No se pudo generar el recibo. Revisa la conexión con el servidor.
              </p>
              <Button type="button" variant="outline" onClick={() => setIntento((n) => n + 1)}>
                <RotateCw aria-hidden="true" />
                Reintentar
              </Button>
            </div>
          )}
          {estado.tipo === "listo" && (
            <iframe
              ref={iframeRef}
              srcDoc={estado.html}
              sandbox="allow-same-origin allow-modals"
              title={`Vista previa del recibo · ${titulo}`}
              className="h-full w-full border-0 bg-white"
              onLoad={() => setIframeListo(true)}
            />
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onAbrirEnPestana}>
            <ExternalLink aria-hidden="true" />
            Abrir en pestaña
          </Button>
          <Button type="button" onClick={imprimir} disabled={!iframeListo}>
            <Printer aria-hidden="true" />
            Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
