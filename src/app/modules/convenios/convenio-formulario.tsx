import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  crearConvenio,
  actualizarConvenio,
  TIPOS_CONVENIO,
  type Convenio,
  type CuerpoConvenio,
  type TipoConvenio,
} from "@/app/modules/convenios/conveniosApi";
import { listarProveedores, type Proveedor } from "@/app/modules/proveedores/proveedoresApi";
import { listarBodegas, type Bodega } from "@/app/modules/bodega/bodegasApi";
import { interpretarErrorHttp } from "@/app/http/errores";
import { obtenerTodo } from "@/app/http/paginacion";
import { convenioSchema, type ConvenioFormValues } from "@/app/modules/convenios/convenioSchema";
import styles from "@/app/modules/materiales/material-formulario.module.css";

const SIN_SELECCION = "__ninguno__";

const ETIQUETAS_TIPO: Record<string, string> = {
  COMPRA: "Compra",
  VENTA: "Venta",
  INTERCAMBIO: "Intercambio",
  SERVICIO: "Servicio",
};

export function ConvenioFormulario({
  convenio,
  alGuardar,
  alCerrar,
}: {
  convenio?: Convenio | null;
  alGuardar: (resultado: Convenio) => void;
  alCerrar: () => void;
}) {
  const esEdicion = Boolean(convenio);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ConvenioFormValues>({
    resolver: zodResolver(convenioSchema),
    defaultValues: {
      nombre: convenio?.nombre ?? "",
      tipo: convenio?.tipo ?? "",
      proveedorId: convenio?.proveedorId ?? SIN_SELECCION,
      bodegaId: convenio?.bodegaId ?? SIN_SELECCION,
      fechaInicio: convenio?.fechaInicio?.slice(0, 10) ?? "",
      fechaFin: convenio?.fechaFin?.slice(0, 10) ?? "",
      valorTotal: convenio?.valorTotal != null ? String(convenio.valorTotal) : "",
      responsable: convenio?.responsable ?? "",
      descripcion: convenio?.descripcion ?? "",
    },
  });

  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [bodegas, setBodegas] = useState<Bodega[]>([]);

  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    obtenerTodo((page, size) => listarProveedores({ estado: "ACTIVO", page, size }))
      .then(setProveedores)
      .catch(() => {});
    obtenerTodo((page, size) => listarBodegas({ estado: "ACTIVA", page, size }))
      .then(setBodegas)
      .catch(() => {});
  }, []);

  async function onSubmit(valores: ConvenioFormValues) {
    setErrorGeneral(null);

    const cuerpo: CuerpoConvenio = {
      nombre: valores.nombre.trim(),
      tipo: valores.tipo as TipoConvenio,
      proveedorId: valores.proveedorId === SIN_SELECCION ? null : valores.proveedorId,
      bodegaId: valores.bodegaId === SIN_SELECCION ? null : valores.bodegaId,
      fechaInicio: valores.fechaInicio,
      fechaFin: valores.fechaFin || null,
      valorTotal: valores.valorTotal === "" ? null : parseFloat(valores.valorTotal),
      responsable: valores.responsable.trim() || null,
      descripcion: valores.descripcion.trim() || null,
    };

    setEnviando(true);
    try {
      const resultado = esEdicion
        ? await actualizarConvenio(convenio!.id, cuerpo)
        : await crearConvenio(cuerpo);
      alGuardar(resultado);
    } catch (error) {
      setErrorGeneral(interpretarErrorHttp(error, {
        409: "Ya existe un convenio con ese código.",
        404: "El convenio no existe o fue eliminado.",
      }, "Ocurrió un error al guardar el convenio. Intenta de nuevo."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className={styles.formulario} onSubmit={handleSubmit(onSubmit)}>
      {errorGeneral && <div className={styles.alertaError}>{errorGeneral}</div>}

      <div className={styles.fila}>
        <div className={`${styles.campo} ${styles.campoAncho}`}>
          <Label htmlFor="nombre">Nombre *</Label>
          <Input
            id="nombre"
            {...register("nombre")}
            placeholder="Convenio de compra de PET 2025"
          />
          {errors.nombre && <span className={styles.errorCampo}>{errors.nombre.message}</span>}
        </div>
        <div className={styles.campo}>
          <Label>Tipo *</Label>
          <Controller
            name="tipo"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_CONVENIO.map((t) => (
                    <SelectItem key={t} value={t}>
                      {ETIQUETAS_TIPO[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.tipo && <span className={styles.errorCampo}>{errors.tipo.message}</span>}
        </div>
      </div>

      <div className={styles.fila}>
        <div className={styles.campo}>
          <Label>Proveedor</Label>
          <Controller
            name="proveedorId"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin proveedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SIN_SELECCION}>Sin proveedor</SelectItem>
                  {proveedores.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className={styles.campo}>
          <Label>Bodega</Label>
          <Controller
            name="bodegaId"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin bodega" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SIN_SELECCION}>Sin bodega</SelectItem>
                  {bodegas.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className={styles.fila}>
        <div className={styles.campo}>
          <Label htmlFor="fechaInicio">Fecha de inicio *</Label>
          <Input id="fechaInicio" type="date" {...register("fechaInicio")} />
          {errors.fechaInicio && <span className={styles.errorCampo}>{errors.fechaInicio.message}</span>}
        </div>
        <div className={styles.campo}>
          <Label htmlFor="fechaFin">Fecha de fin</Label>
          <Input id="fechaFin" type="date" {...register("fechaFin")} />
          {errors.fechaFin && <span className={styles.errorCampo}>{errors.fechaFin.message}</span>}
        </div>
      </div>

      <div className={styles.fila}>
        <div className={styles.campo}>
          <Label htmlFor="valorTotal">Valor total (COP)</Label>
          <Input
            id="valorTotal"
            type="number"
            step="0.01"
            min="0"
            {...register("valorTotal")}
            placeholder="5000000.00"
          />
          {errors.valorTotal && <span className={styles.errorCampo}>{errors.valorTotal.message}</span>}
        </div>
        <div className={styles.campo}>
          <Label htmlFor="responsable">Responsable</Label>
          <Input
            id="responsable"
            {...register("responsable")}
            placeholder="Juan Pérez"
          />
        </div>
      </div>

      <div className={styles.campo}>
        <Label htmlFor="descripcion">Descripción / Condiciones</Label>
        <Textarea
          id="descripcion"
          {...register("descripcion")}
          placeholder="Describe las condiciones, términos y alcance del convenio..."
          rows={3}
        />
      </div>

      <div className={styles.acciones}>
        <Button type="button" variant="outline" onClick={alCerrar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={enviando}>
          {enviando ? "Guardando..." : esEdicion ? "Guardar cambios" : "Crear convenio"}
        </Button>
      </div>
    </form>
  );
}
