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
import { registrarMerma, type LineaInventario } from "@/app/modules/inventario/inventarioApi";
import { interpretarErrorHttp, mensajeDelServidor } from "@/app/http/errores";
import {
  mermaSchema,
  type MermaFormInput,
  type MermaFormOutput,
} from "@/app/modules/inventario/mermaSchema";
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
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MermaFormInput, unknown, MermaFormOutput>({
    resolver: zodResolver(mermaSchema),
    defaultValues: {
      cantidad: "",
      motivo: "",
    },
  });

  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(valores: MermaFormOutput) {
    setErrorGeneral(null);
    setEnviando(true);
    try {
      const resultado = await registrarMerma(linea.id, {
        cantidad: valores.cantidad,
        motivo: valores.motivo.trim(),
      });
      alGuardar(resultado);
    } catch (error) {
      setErrorGeneral(interpretarErrorHttp(error, {
        // El backend valida "merma > stock actual" como regla de negocio (400), no como
        // conflicto HTTP; mensajeDelServidor trae el detalle exacto ("La merma (X) supera...").
        400: mensajeDelServidor(error) ?? "Revisa los datos.",
        // Único origen posible del 409 aquí: bloqueo optimista (@Version) por edición concurrente.
        409: "Otro usuario actualizó esta línea justo antes de tu envío. Cierra y vuelve a intentar con los datos actuales.",
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
        <form className={styles.formulario} onSubmit={handleSubmit(onSubmit)}>
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
              {...register("cantidad")}
              placeholder="50.00"
            />
            {errors.cantidad && <span className={styles.errorCampo}>{errors.cantidad.message}</span>}
          </div>
          <div className={styles.campo}>
            <Label htmlFor="motivo">Motivo *</Label>
            <Textarea
              id="motivo"
              rows={3}
              {...register("motivo")}
              placeholder="Material contaminado descartado"
            />
            {errors.motivo && <span className={styles.errorCampo}>{errors.motivo.message}</span>}
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
