import { useState } from "react";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { registrarMerma, type LineaInventario } from "@/app/modules/inventario/inventarioApi";
import { interpretarErrorHttp } from "@/app/http/errores";
import styles from "@/app/modules/materiales/material-formulario.module.css";

export function MermaModal({
  linea,
  alCerrar,
  alGuardar,
}: {
  linea: LineaInventario;
  alCerrar: () => void;
  alGuardar: (resultado: LineaInventario) => void;
}) {
  const [cantidad, setCantidad] = useState("");
  const [motivo, setMotivo] = useState("");
  const [errores, setErrores] = useState<{ [k: string]: string }>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function validar(): boolean {
    const e: { [k: string]: string } = {};
    const valor = parseFloat(cantidad);
    if (cantidad === "" || Number.isNaN(valor) || valor <= 0) {
      e.cantidad = "La cantidad debe ser mayor que 0.";
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
      const resultado = await registrarMerma(linea.id, {
        cantidad: parseFloat(cantidad),
        motivo: motivo.trim(),
      });
      alGuardar(resultado);
    } catch (error) {
      setErrorGeneral(interpretarErrorHttp(error, {
        409: "La merma supera el stock disponible.",
        400: "Revisa los datos.",
      }, "No se pudo registrar la merma."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open onOpenChange={(abierto) => !abierto && alCerrar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar merma</DialogTitle>
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
            <Label htmlFor="cantidad">Cantidad a descontar *</Label>
            <Input
              id="cantidad"
              type="number"
              step="0.01"
              min="0"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="50.00"
            />
            {errores.cantidad && <span className={styles.errorCampo}>{errores.cantidad}</span>}
          </div>
          <div className={styles.campo}>
            <Label htmlFor="motivo">Motivo *</Label>
            <Textarea
              id="motivo"
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Material contaminado descartado"
            />
            {errores.motivo && <span className={styles.errorCampo}>{errores.motivo}</span>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={alCerrar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={enviando}>
              {enviando ? "Guardando..." : "Registrar merma"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
