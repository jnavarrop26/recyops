import { useState } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { registrarAjuste, type LineaInventario } from "../servicios/inventarioApi";
import styles from "./material-formulario.module.css";

export function AjusteModal({
  linea,
  alCerrar,
  alGuardar,
}: {
  linea: LineaInventario;
  alCerrar: () => void;
  alGuardar: (resultado: LineaInventario) => void;
}) {
  const [cantidadNueva, setCantidadNueva] = useState(String(linea.stockActual));
  const [motivo, setMotivo] = useState("");
  const [errores, setErrores] = useState<{ [k: string]: string }>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function validar(): boolean {
    const e: { [k: string]: string } = {};
    const valor = parseFloat(cantidadNueva);
    if (cantidadNueva === "" || Number.isNaN(valor) || valor < 0) {
      e.cantidadNueva = "La cantidad nueva debe ser mayor o igual a 0.";
    }
    if (motivo.trim().length < 5) e.motivo = "El motivo debe tener al menos 5 caracteres.";
    setErrores(e);
    return Object.keys(e).length === 0;
  }

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErrorGeneral(null);
    if (!validar()) return;
    setEnviando(true);
    try {
      const resultado = await registrarAjuste(linea.id, {
        cantidadNueva: parseFloat(cantidadNueva),
        motivo: motivo.trim(),
      });
      alGuardar(resultado);
    } catch (error: any) {
      const s = error?.response?.status;
      if (s === 400) setErrorGeneral("Revisa los datos.");
      else if (s === 403) setErrorGeneral("No tienes permisos para esta acción.");
      else if (s === 404) setErrorGeneral("Registro no encontrado.");
      else setErrorGeneral("No se pudo registrar el ajuste.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open onOpenChange={(abierto) => !abierto && alCerrar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajuste manual de inventario</DialogTitle>
          <DialogDescription>
            {linea.tipoMaterialNombre} · {linea.bodegaNombre}
          </DialogDescription>
        </DialogHeader>
        <form className={styles.formulario} onSubmit={enviar}>
          {errorGeneral && <div className={styles.alertaError}>{errorGeneral}</div>}
          <div className={styles.campo}>
            <Label>Stock actual</Label>
            <Input value={`${linea.stockActual.toLocaleString("es-CO")}`} disabled />
          </div>
          <div className={styles.campo}>
            <Label htmlFor="cantidadNueva">Nuevo valor de stock *</Label>
            <Input
              id="cantidadNueva"
              type="number"
              step="0.01"
              min="0"
              value={cantidadNueva}
              onChange={(e) => setCantidadNueva(e.target.value)}
            />
            {errores.cantidadNueva && <span className={styles.errorCampo}>{errores.cantidadNueva}</span>}
          </div>
          <div className={styles.campo}>
            <Label htmlFor="motivo">Motivo *</Label>
            <Textarea
              id="motivo"
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Conteo físico - corrección de inventario"
            />
            {errores.motivo && <span className={styles.errorCampo}>{errores.motivo}</span>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={alCerrar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={enviando}>
              {enviando ? "Guardando..." : "Registrar ajuste"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
