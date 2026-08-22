import logoMarcaAgua from "@/app/public/icons/logo-1-recyops.svg?raw";
import faviconRecyops from "@/app/public/icons/favicon-recyops.svg?raw";
import { obtenerEntrega, type Entrega, type EstadoEntrega } from "@/app/modules/entregas/entregasApi";

/**
 * Plantilla HTML imprimible del recibo de entrega de material a bodega.
 * Se abre en una ventana nueva lista para imprimir o guardar como PDF.
 * Comparte el sistema visual del recibo de ingreso (mismo ticket, misma
 * marca de agua y paleta) para que ambos documentos se vean como parte
 * de la misma familia, con dos firmas en blanco al final.
 */

const ETIQUETAS_ESTADO: Record<EstadoEntrega, string> = {
  RECIBIDA: "Recibida",
  EN_PROCESO: "En proceso",
  PROCESADA: "Procesada",
  DESPACHADA: "Despachada",
};

const TINTAS_ESTADO: Record<EstadoEntrega, string> = {
  RECIBIDA: "#B97A12",
  EN_PROCESO: "#1D6FB8",
  PROCESADA: "#178E3B",
  DESPACHADA: "#178E3B",
};

const escapar = (valor: string | null | undefined) =>
  (valor ?? "—").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const kilos = (v: number) =>
  v.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function nombrePersonaConCedula(entrega: Entrega): string | null {
  if (!entrega.personaEntregaNombre) return null;
  return entrega.personaEntregaCedula
    ? `${entrega.personaEntregaNombre} (CC ${entrega.personaEntregaCedula})`
    : entrega.personaEntregaNombre;
}

function fechaLarga(iso: string) {
  const f = new Date(iso);
  if (Number.isNaN(f.getTime())) return iso;
  return f.toLocaleString("es-CO", {
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function plantillaReciboEntrega(entrega: Entrega): string {
  const estado = ETIQUETAS_ESTADO[entrega.estado] ?? entrega.estado;
  const tintaEstado = TINTAS_ESTADO[entrega.estado] ?? "#203529";

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>${escapar(entrega.codigo)} · Recibo de entrega · RecyOPS</title>
<style>
  :root {
    --tinta: #203529;
    --verde: #178E3B;
    --verde-claro: #2FA65B;
    --linea: #D9E2DC;
    --tenue: #6B7C72;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #EDF1EE;
    font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
    color: var(--tinta);
    padding: 32px 16px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .mono { font-family: ui-monospace, "Cascadia Mono", Consolas, "Courier New", monospace; }

  .recibo {
    position: relative;
    width: 640px;
    max-width: 100%;
    margin: 0 auto;
    background: #fff;
    border-left: 1px solid var(--linea);
    border-right: 1px solid var(--linea);
    overflow: hidden;
  }
  .perforado {
    height: 12px;
    background:
      radial-gradient(circle at 8px 0, #EDF1EE 5px, transparent 5.5px) repeat-x,
      #fff;
    background-size: 16px 12px;
  }
  .perforado.abajo { transform: rotate(180deg); }

  .marca-agua {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.05;
    pointer-events: none;
    z-index: 0;
  }
  .marca-agua svg { width: 68%; height: auto; }

  .contenido { position: relative; z-index: 1; padding: 24px 36px 28px; }

  header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    border-bottom: 3px solid var(--verde);
    padding-bottom: 16px;
  }
  .identidad { display: flex; align-items: center; gap: 12px; }
  .identidad svg { width: 46px; height: 46px; }
  .nombre { font-size: 20px; font-weight: 800; letter-spacing: -0.02em; }
  .nombre span { color: var(--verde); }
  .lema { font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: var(--tenue); margin-top: 2px; }
  .folio { text-align: right; }
  .folio-etiqueta { font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: var(--tenue); }
  .folio-numero { font-size: 19px; font-weight: 700; }
  .folio-fecha { font-size: 11px; color: var(--tenue); margin-top: 3px; }
  .folio-uuid { font-size: 9px; color: var(--tenue); margin-top: 4px; letter-spacing: 0.02em; }

  .titulo-doc {
    margin: 18px 0 14px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.22em;
    color: var(--tinta);
  }

  .sello {
    position: absolute;
    top: 132px;
    right: 34px;
    transform: rotate(-8deg);
    border: 2.5px solid ${tintaEstado};
    border-radius: 6px;
    box-shadow: inset 0 0 0 2px #fff, inset 0 0 0 3.5px ${tintaEstado};
    color: ${tintaEstado};
    font-size: 13px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    padding: 7px 14px;
    opacity: 0.85;
    z-index: 2;
  }

  .datos {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 32px;
    border-top: 1px dashed var(--linea);
  }
  .grupo { padding: 12px 0; }
  .grupo + .grupo { border-top: 1px dashed var(--linea); }
  .datos .grupo:nth-child(2) { border-top: none; }
  .etiqueta {
    font-size: 9.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--tenue);
    margin-bottom: 4px;
  }
  .valor { font-size: 14px; }

  .tabla-lineas { margin-top: 18px; }
  .tabla-lineas table { width: 100%; border-collapse: collapse; }
  .tabla-lineas th {
    text-align: left;
    font-size: 9.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--tenue);
    padding: 6px 0;
    border-bottom: 1px solid var(--linea);
  }
  .tabla-lineas td {
    font-size: 13px;
    padding: 7px 0;
    border-bottom: 1px dashed var(--linea);
  }
  .col-derecha { text-align: right; }

  .cifra-envoltorio {
    border: 1.5px solid var(--tinta);
    margin-top: 16px;
    padding: 14px 18px 16px;
    text-align: center;
  }
  .cifra-valor { font-size: 25px; font-weight: 700; line-height: 1.1; }
  .cifra-unidad { font-size: 13px; font-weight: 400; color: var(--tenue); }

  .firmas {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 48px;
    margin-top: 76px;
  }
  .firma-linea { border-top: 1px solid var(--tinta); padding-top: 6px; }
  .firma-nombre { font-size: 13px; font-weight: 600; }
  .firma-rol {
    font-size: 9.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--tenue);
    margin-top: 2px;
  }
  .firma-detalle { font-size: 11px; color: var(--tenue); margin-top: 1px; }

  footer {
    margin-top: 22px;
    padding-top: 10px;
    border-top: 1px dashed var(--linea);
    display: flex;
    justify-content: space-between;
    font-size: 9.5px;
    color: var(--tenue);
    letter-spacing: 0.04em;
  }

  .acciones { text-align: center; margin: 22px auto 0; }
  .acciones button {
    font: inherit;
    font-weight: 600;
    color: #fff;
    background: var(--verde);
    border: none;
    border-radius: 8px;
    padding: 10px 26px;
    cursor: pointer;
  }
  .acciones button:hover { background: var(--verde-claro); }

  @media print {
    body { background: #fff; padding: 0; }
    .recibo { width: 100%; border: none; }
    .perforado { display: none; }
    .acciones { display: none; }
  }
  @page { size: letter portrait; margin: 18mm 16mm; }
</style>
</head>
<body>
  <div class="recibo">
    <div class="perforado"></div>
    <div class="marca-agua">${logoMarcaAgua}</div>

    <div class="sello">${escapar(estado)}</div>

    <div class="contenido">
      <header>
        <div class="identidad">
          ${faviconRecyops}
          <div>
            <div class="nombre">Recy<span>OPS</span></div>
            <div class="lema">Sistema de bodegas de reciclaje</div>
          </div>
        </div>
        <div class="folio">
          <div class="folio-etiqueta">Recibo N.º</div>
          <div class="folio-numero mono">${escapar(entrega.codigo)}</div>
          <div class="folio-fecha">${escapar(fechaLarga(entrega.fechaRecepcion))}</div>
          <div class="folio-uuid mono">Verificación: ${escapar(entrega.id)}</div>
        </div>
      </header>

      <div class="titulo-doc">Recibo de entrega de material</div>

      <div class="datos">
        <div class="grupo">
          <div class="etiqueta">Convenio</div>
          <div class="valor">${escapar(entrega.convenioNombre)}</div>
        </div>
        <div class="grupo">
          <div class="etiqueta">Persona que entrega</div>
          <div class="valor">${escapar(nombrePersonaConCedula(entrega))}</div>
        </div>
        <div class="grupo">
          <div class="etiqueta">Bodega destino</div>
          <div class="valor">${escapar(entrega.bodegaNombre)}</div>
        </div>
        <div class="grupo">
          <div class="etiqueta">Recibido por</div>
          <div class="valor">${escapar(entrega.usuarioRegistroNombre)}</div>
        </div>
        <div class="grupo">
          <div class="etiqueta">Fecha de recepción</div>
          <div class="valor">${escapar(fechaLarga(entrega.fechaRecepcion))}</div>
        </div>
      </div>

      <div class="tabla-lineas">
        <table>
          <thead>
            <tr><th>Material</th><th class="col-derecha">Peso (kg)</th></tr>
          </thead>
          <tbody>
            ${entrega.lineas.map((linea) => `
            <tr>
              <td>${escapar(linea.tipoMaterialNombre)}</td>
              <td class="mono col-derecha">${kilos(linea.pesoKg)}</td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>

      <div class="cifra-envoltorio">
        <div class="etiqueta">Total recibido</div>
        <div class="cifra-valor mono">${kilos(entrega.totalKg)} <span class="cifra-unidad">kg</span></div>
      </div>

      <div class="firmas">
        <div class="firma-linea">
          <div class="firma-nombre">${escapar(nombrePersonaConCedula(entrega))}</div>
          <div class="firma-rol">Quien entrega</div>
          <div class="firma-detalle">${escapar(entrega.convenioNombre)}</div>
        </div>
        <div class="firma-linea">
          <div class="firma-nombre">${escapar(entrega.usuarioRegistroNombre)}</div>
          <div class="firma-rol">Quien recibe</div>
          <div class="firma-detalle">${escapar(entrega.bodegaNombre)}</div>
        </div>
      </div>

      <footer>
        <span>RecyOPS · Trazabilidad de material reciclable</span>
        <span class="mono">${escapar(entrega.codigo)} · ${escapar(entrega.id)}</span>
      </footer>
    </div>
    <div class="perforado abajo"></div>
  </div>

  <div class="acciones">
    <button onclick="window.print()">Imprimir recibo</button>
  </div>
</body>
</html>`;
}

/**
 * Trae la entrega completa y abre el recibo. La ventana se abre primero
 * (sincrónicamente, en el gesto del clic) para no chocar con el bloqueador
 * de emergentes; el contenido se navega después vía un Blob URL en lugar de
 * document.write, que algunos navegadores bloquean o ignoran cuando se
 * invoca de forma asíncrona sobre un documento ya cargado.
 */
export async function abrirReciboEntrega(id: string): Promise<void> {
  const ventana = window.open("", "_blank");
  if (!ventana) return;
  ventana.document.title = "Generando recibo…";
  try {
    const entrega = await obtenerEntrega(id);
    const url = URL.createObjectURL(
      new Blob([plantillaReciboEntrega(entrega)], { type: "text/html" }),
    );
    ventana.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch {
    const url = URL.createObjectURL(
      new Blob(
        [
          '<p style="font-family:sans-serif;padding:24px;color:#c0392b">No se pudo generar el recibo. Revisa la conexión con el servidor.</p>',
        ],
        { type: "text/html" },
      ),
    );
    ventana.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
}
