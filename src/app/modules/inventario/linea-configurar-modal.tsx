import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  crearLinea,
  actualizarTopes,
  type LineaInventario,
} from "@/app/modules/inventario/inventarioApi";
import { listarBodegas, type Bodega } from "@/app/modules/bodega/bodegasApi";
import { listarMateriales, type Material } from "@/app/modules/materiales/materialesApi";
import { interpretarErrorHttp } from "@/app/http/errores";
import {
  crearLineaConfigurarSchema,
  type LineaConfigurarFormInput,
  type LineaConfigurarFormOutput,
} from "@/app/modules/inventario/lineaConfigurarSchema";
import styles from "@/app/modules/materiales/material-formulario.module.css";

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

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LineaConfigurarFormInput, unknown, LineaConfigurarFormOutput>({
    resolver: zodResolver(crearLineaConfigurarSchema(esEdicion)),
    defaultValues: {
      bodegaId: linea?.bodegaId ?? bodegaIdPorDefecto ?? "",
      tipoMaterialId: linea?.tipoMaterialId ?? "",
      stockMinimo: linea ? String(linea.stockMinimo) : "0",
      stockMaximo: linea ? String(linea.stockMaximo) : "0",
    },
  });

  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [materiales, setMateriales] = useState<Material[]>([]);
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

  async function onSubmit(valores: LineaConfigurarFormOutput) {
    setErrorGeneral(null);
    setEnviando(true);
    try {
      const resultado = esEdicion
        ? await actualizarTopes(linea!.id, {
            stockMinimo: valores.stockMinimo,
            stockMaximo: valores.stockMaximo,
          })
        : await crearLinea({
            bodegaId: valores.bodegaId,
            tipoMaterialId: valores.tipoMaterialId,
            stockMinimo: valores.stockMinimo,
            stockMaximo: valores.stockMaximo,
          });
      alGuardar(resultado);
    } catch (error) {
      setErrorGeneral(interpretarErrorHttp(error, {
        // 409 significa algo distinto según la operación: al crear, es un duplicado
        // (LineaDuplicadaException); al editar topes, solo puede ser bloqueo optimista
        // por edición concurrente (no hay chequeo de duplicado en el PUT).
        409: esEdicion
          ? "Otro usuario actualizó esta línea justo antes de tu envío. Cierra y vuelve a intentar."
          : "Ese material ya está registrado en esta bodega.",
        400: "Revisa los datos.",
      }, "No se pudo guardar la configuración."));
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
        <form className={styles.formulario} onSubmit={handleSubmit(onSubmit)}>
          {errorGeneral && <div className={styles.alertaError}>{errorGeneral}</div>}

          {!esEdicion && (
            <>
              <div className={styles.campo}>
                <Label>Bodega *</Label>
                <Controller
                  name="bodegaId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
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
                  )}
                />
                {errors.bodegaId && <span className={styles.errorCampo}>{errors.bodegaId.message}</span>}
              </div>
              <div className={styles.campo}>
                <Label>Material *</Label>
                <Controller
                  name="tipoMaterialId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
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
                  )}
                />
                {errors.tipoMaterialId && <span className={styles.errorCampo}>{errors.tipoMaterialId.message}</span>}
              </div>
            </>
          )}

          <div className={styles.fila}>
            <div className={styles.campo}>
              <Label htmlFor="stockMinimo">Stock mínimo</Label>
              <Input id="stockMinimo" type="number" step="0.01" min="0" {...register("stockMinimo")} />
              {errors.stockMinimo && <span className={styles.errorCampo}>{errors.stockMinimo.message}</span>}
            </div>
            <div className={styles.campo}>
              <Label htmlFor="stockMaximo">Stock máximo</Label>
              <Input id="stockMaximo" type="number" step="0.01" min="0" {...register("stockMaximo")} />
              {errors.stockMaximo && <span className={styles.errorCampo}>{errors.stockMaximo.message}</span>}
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
