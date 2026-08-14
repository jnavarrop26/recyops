import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
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
  crearBodega,
  actualizarBodega,
  TIPOS_ORGANIZACION,
  type Bodega,
  type CuerpoBodega,
} from "@/app/modules/bodega/bodegasApi";
import { interpretarErrorHttp } from "@/app/http/errores";
import { bodegaSchema, type BodegaFormValues } from "@/app/modules/bodega/bodegaSchema";
import styles from "@/app/modules/materiales/material-formulario.module.css";

export function BodegaFormulario({
  bodega,
  alGuardar,
  alCerrar,
}: {
  bodega?: Bodega | null;
  alGuardar: (resultado: Bodega) => void;
  alCerrar: () => void;
}) {
  const esEdicion = Boolean(bodega);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<BodegaFormValues>({
    resolver: zodResolver(bodegaSchema),
    defaultValues: {
      nombre: bodega?.nombre ?? "",
      direccion: bodega?.direccion ?? "",
      telefono: bodega?.telefono ?? "",
      email: bodega?.email ?? "",
      nit: bodega?.nit ?? "",
      latitud: bodega?.latitud != null ? String(bodega.latitud) : "",
      longitud: bodega?.longitud != null ? String(bodega.longitud) : "",
      tipoOrganizacion: bodega?.tipoOrganizacion ?? "",
    },
  });

  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(valores: BodegaFormValues) {
    setErrorGeneral(null);

    const cuerpo: CuerpoBodega = {
      nombre: valores.nombre.trim(),
      direccion: valores.direccion.trim(),
      telefono: valores.telefono.trim(),
      email: valores.email.trim(),
      nit: valores.nit.trim(),
      latitud: valores.latitud === "" ? null : parseFloat(valores.latitud),
      longitud: valores.longitud === "" ? null : parseFloat(valores.longitud),
      tipoOrganizacion: valores.tipoOrganizacion,
    };

    setEnviando(true);
    try {
      const resultado = esEdicion
        ? await actualizarBodega(bodega!.id, cuerpo)
        : await crearBodega(cuerpo);
      alGuardar(resultado);
    } catch (error) {
      setErrorGeneral(interpretarErrorHttp(error, {
        404: "La bodega no existe o fue eliminada.",
      }, "Ocurrió un error al guardar la bodega. Intenta de nuevo."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className={styles.formulario} onSubmit={handleSubmit(onSubmit)}>
      {errorGeneral && <div className={styles.alertaError}>{errorGeneral}</div>}

      <div className={styles.campo}>
        <Label htmlFor="nombre">Nombre *</Label>
        <Input id="nombre" {...register("nombre")} placeholder="Bodega Central" />
        {errors.nombre && <span className={styles.errorCampo}>{errors.nombre.message}</span>}
      </div>

      <div className={styles.campo}>
        <Label htmlFor="direccion">Dirección *</Label>
        <Input id="direccion" {...register("direccion")} placeholder="Cra 10 # 20-30" />
        {errors.direccion && <span className={styles.errorCampo}>{errors.direccion.message}</span>}
      </div>

      <div className={styles.fila}>
        <div className={styles.campo}>
          <Label htmlFor="telefono">Teléfono</Label>
          <Input id="telefono" inputMode="numeric" {...register("telefono")} placeholder="3001234567" />
          {errors.telefono && <span className={styles.errorCampo}>{errors.telefono.message}</span>}
        </div>
        <div className={styles.campo}>
          <Label htmlFor="nit">NIT *</Label>
          <Input id="nit" {...register("nit")} placeholder="900123456-7" />
          {errors.nit && <span className={styles.errorCampo}>{errors.nit.message}</span>}
        </div>
      </div>

      <div className={styles.campo}>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register("email")} placeholder="central@sicofark.com" />
        {errors.email && <span className={styles.errorCampo}>{errors.email.message}</span>}
      </div>

      <div className={styles.fila}>
        <div className={styles.campo}>
          <Label>Tipo de organización *</Label>
          <Controller
            name="tipoOrganizacion"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_ORGANIZACION.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.tipoOrganizacion && <span className={styles.errorCampo}>{errors.tipoOrganizacion.message}</span>}
        </div>
      </div>

      <div className={styles.fila}>
        <div className={styles.campo}>
          <Label htmlFor="latitud">Latitud</Label>
          <Input id="latitud" type="number" step="0.00001" {...register("latitud")} placeholder="4.60971" />
          {errors.latitud && <span className={styles.errorCampo}>{errors.latitud.message}</span>}
        </div>
        <div className={styles.campo}>
          <Label htmlFor="longitud">Longitud</Label>
          <Input id="longitud" type="number" step="0.00001" {...register("longitud")} placeholder="-74.08175" />
          {errors.longitud && <span className={styles.errorCampo}>{errors.longitud.message}</span>}
        </div>
      </div>

      <div className={styles.acciones}>
        <Button type="button" variant="outline" onClick={alCerrar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={enviando}>
          {enviando ? "Guardando..." : esEdicion ? "Guardar cambios" : "Crear bodega"}
        </Button>
      </div>
    </form>
  );
}
