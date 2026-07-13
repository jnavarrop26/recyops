import { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  crearLinea,
  actualizarTopes,
  type LineaInventario,
} from "../servicios/inventarioApi";
import { listarBodegas, type Bodega } from "../servicios/bodegasApi";
import { listarMateriales, type Material } from "../servicios/materialesApi";
import styles from "./material-formulario.module.css";

export function LineaConfigurarModal({
  linea,
  bodegaIdPorDefecto,
  alCerrar,
  alGuardar,
}: {
  linea?: LineaInventario | null;
  bodegaIdPorDefecto?: string;
  alCerrar: () => void;
  alGuardar: (resultado: LineaInventario) => void;
}) {
  const esEdicion = Boolean(linea);

  const [bodegaId, setBodegaId] = useState(linea?.bodegaId ?? bodegaIdPorDefecto ?? "");
  const [tipoMaterialId, setTipoMaterialId] = useState(linea?.tipoMaterialId ?? "");
  const [stockMinimo, setStockMinimo] = useState(linea ? String(linea.stockMinimo) : "0");
  const [stockMaximo, setStockMaximo] = useState(linea ? String(linea.stockMaximo) : "0");

  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [errores, setErrores] = useState<{ [k: string]: string }>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (esEdicion) return;
    (async () => {
      try {
        const [bs, ms] = await Promise.all([
          listarBodegas({ size: 100 }),
          listarMateriales({ size: 100, activo: "true" }),
        ]);
        setBodegas(bs.content);
        setMateriales(ms.content);
      } catch {
        setErrorGeneral("No se pudieron cargar las bodegas o materiales.");
      }
    })();
  }, [esEdicion]);

  function validar(): boolean {
    const e: { [k: string]: string } = {};
    if (!esEdicion && !bodegaId) e.bodegaId = "Selecciona una bodega.";
    if (!esEdicion && !tipoMaterialId) e.tipoMaterialId = "Selecciona un material.";
    const min = parseFloat(stockMinimo || "0");
    const max = parseFloat(stockMaximo || "0");
    if (min < 0) e.stockMinimo = "El stock mínimo debe ser ≥ 0.";
    if (max < min) e.stockMaximo = "El stock máximo debe ser ≥ al mínimo.";
    setErrores(e);
    return Object.keys(e).length === 0;
  }

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErrorGeneral(null);
    if (!validar()) return;
    setEnviando(true);
    try {
      const min = parseFloat(stockMinimo || "0");
      const max = parseFloat(stockMaximo || "0");
      const resultado = esEdicion
        ? await actualizarTopes(linea!.id, { stockMinimo: min, stockMaximo: max })
        : await crearLinea({ bodegaId, tipoMaterialId, stockMinimo: min, stockMaximo: max });
      alGuardar(resultado);
    } catch (error: any) {
      const s = error?.response?.status;
      if (s === 409) setErrorGeneral("Ese material ya está registrado en esta bodega.");
      else if (s === 400) setErrorGeneral("Revisa los datos.");
      else if (s === 403) setErrorGeneral("No tienes permisos para esta acción.");
      else if (s === 404) setErrorGeneral("Registro no encontrado.");
      else setErrorGeneral("No se pudo guardar la configuración.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open onOpenChange={(abierto) => !abierto && alCerrar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{esEdicion ? "Editar topes de la línea" : "Dar de alta material en bodega"}</DialogTitle>
          <DialogDescription>
            {esEdicion
              ? `${linea!.tipoMaterialNombre} · ${linea!.bodegaNombre}`
              : "El stock inicial es 0; solo se mueve por entregas, ajustes o mermas."}
          </DialogDescription>
        </DialogHeader>
        <form className={styles.formulario} onSubmit={enviar}>
          {errorGeneral && <div className={styles.alertaError}>{errorGeneral}</div>}

          {!esEdicion && (
            <>
              <div className={styles.campo}>
                <Label>Bodega *</Label>
                <Select value={bodegaId} onValueChange={setBodegaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona bodega" />
                  </SelectTrigger>
                  <SelectContent>
                    {bodegas.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errores.bodegaId && <span className={styles.errorCampo}>{errores.bodegaId}</span>}
              </div>
              <div className={styles.campo}>
                <Label>Material *</Label>
                <Select value={tipoMaterialId} onValueChange={setTipoMaterialId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona material" />
                  </SelectTrigger>
                  <SelectContent>
                    {materiales.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errores.tipoMaterialId && <span className={styles.errorCampo}>{errores.tipoMaterialId}</span>}
              </div>
            </>
          )}

          <div className={styles.fila}>
            <div className={styles.campo}>
              <Label htmlFor="stockMinimo">Stock mínimo</Label>
              <Input id="stockMinimo" type="number" step="0.01" min="0" value={stockMinimo} onChange={(e) => setStockMinimo(e.target.value)} />
              {errores.stockMinimo && <span className={styles.errorCampo}>{errores.stockMinimo}</span>}
            </div>
            <div className={styles.campo}>
              <Label htmlFor="stockMaximo">Stock máximo</Label>
              <Input id="stockMaximo" type="number" step="0.01" min="0" value={stockMaximo} onChange={(e) => setStockMaximo(e.target.value)} />
              {errores.stockMaximo && <span className={styles.errorCampo}>{errores.stockMaximo}</span>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={alCerrar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={enviando}>
              {enviando ? "Guardando..." : esEdicion ? "Guardar topes" : "Crear línea"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
