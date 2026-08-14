import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { registrarAjuste, type LineaInventario } from "@/app/modules/inventario/inventarioApi";
import { interpretarErrorHttp, mensajeDelServidor } from "@/app/http/errores";
import {
  ajusteSchema,
  type AjusteFormInput,
  type AjusteFormOutput,
} from "@/app/modules/inventario/ajusteSchema";
import styles from "@/app/modules/materiales/material-formulario.module.css";

export function AjusteModal({
  linea,
  alCerrar,
  alGuardar,
}: {
  linea: LineaInventario;
  alCerrar: () => void;
  alGuardar: (resultado: LineaInventario) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AjusteFormInput, unknown, AjusteFormOutput>({
    resolver: zodResolver(ajusteSchema),
    defaultValues: {
      cantidadNueva: linea.stockActual,
      motivo: "",
    },
  });

  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(valores: AjusteFormOutput) {
    setErrorGeneral(null);
    setEnviando(true);
    try {
      const resultado = await registrarAjuste(linea.id, {
        cantidadNueva: valores.cantidadNueva,
        motivo: valores.motivo.trim(),
      });
      alGuardar(resultado);
    } catch (error) {
      setErrorGeneral(interpretarErrorHttp(error, {
        400: mensajeDelServidor(error) ?? "Revisa los datos.",
        // Único origen posible del 409 aquí: bloqueo optimista (@Version) por edición concurrente.
        409: "Otro usuario actualizó esta línea justo antes de tu envío. Cierra y vuelve a intentar con los datos actuales.",
      }, "No se pudo registrar el ajuste."));
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
        <form className={styles.formulario} onSubmit={handleSubmit(onSubmit)}>
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
              {...register("cantidadNueva")}
            />
            {errors.cantidadNueva && <span className={styles.errorCampo}>{errors.cantidadNueva.message}</span>}
          </div>
          <div className={styles.campo}>
            <Label htmlFor="motivo">Motivo *</Label>
            <Textarea
              id="motivo"
              rows={3}
              {...register("motivo")}
              placeholder="Conteo físico - corrección de inventario"
            />
            {errors.motivo && <span className={styles.errorCampo}>{errors.motivo.message}</span>}
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
