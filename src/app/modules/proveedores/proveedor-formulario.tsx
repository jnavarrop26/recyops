import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import {
  crearProveedor,
  actualizarProveedor,
  type Proveedor,
  type CuerpoProveedor,
} from "@/app/modules/proveedores/proveedoresApi";
import { estadoHttp, interpretarErrorHttp } from "@/app/http/errores";
import { proveedorSchema, type ProveedorFormValues } from "@/app/modules/proveedores/proveedorSchema";
import styles from "@/app/modules/materiales/material-formulario.module.css";

export function ProveedorFormulario({
  proveedor,
  alGuardar,
  alCerrar,
}: {
  proveedor?: Proveedor | null;
  alGuardar: (resultado: Proveedor) => void;
  alCerrar: () => void;
}) {
  const esEdicion = Boolean(proveedor);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ProveedorFormValues>({
    resolver: zodResolver(proveedorSchema),
    defaultValues: {
      nombre: proveedor?.nombre ?? "",
      nit: proveedor?.nit ?? "",
      contacto: proveedor?.contacto ?? "",
      telefono: proveedor?.telefono ?? "",
      email: proveedor?.email ?? "",
      direccion: proveedor?.direccion ?? "",
    },
  });

  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(valores: ProveedorFormValues) {
    setErrorGeneral(null);

    const cuerpo: CuerpoProveedor = {
      nombre: valores.nombre.trim(),
      nit: valores.nit.trim(),
      contacto: valores.contacto.trim() || null,
      telefono: valores.telefono.trim() || null,
      email: valores.email.trim() || null,
      direccion: valores.direccion.trim() || null,
    };

    setEnviando(true);
    try {
      const resultado = esEdicion
        ? await actualizarProveedor(proveedor!.id, cuerpo)
        : await crearProveedor(cuerpo);
      alGuardar(resultado);
    } catch (error) {
      if (estadoHttp(error) === 409) {
        setError("nit", { message: "Ya existe un proveedor con ese NIT." });
      }
      setErrorGeneral(interpretarErrorHttp(error, {
        409: "Ya existe un proveedor con ese NIT.",
        404: "El proveedor no existe o fue eliminado.",
      }, "Ocurrió un error al guardar el proveedor. Intenta de nuevo."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className={styles.formulario} onSubmit={handleSubmit(onSubmit)}>
      {errorGeneral && <div className={styles.alertaError}>{errorGeneral}</div>}

      <div className={styles.campo}>
        <Label htmlFor="nombre">Nombre *</Label>
        <Input id="nombre" {...register("nombre")} placeholder="Reciclados del Norte S.A.S" />
        {errors.nombre && <span className={styles.errorCampo}>{errors.nombre.message}</span>}
      </div>

      <div className={styles.fila}>
        <div className={styles.campo}>
          <Label htmlFor="nit">NIT *</Label>
          <Input id="nit" {...register("nit")} placeholder="901234567-8" />
          {errors.nit && <span className={styles.errorCampo}>{errors.nit.message}</span>}
        </div>
        <div className={styles.campo}>
          <Label htmlFor="contacto">Contacto</Label>
          <Input id="contacto" {...register("contacto")} placeholder="María Gómez" />
        </div>
      </div>

      <div className={styles.fila}>
        <div className={styles.campo}>
          <Label htmlFor="telefono">Teléfono</Label>
          <Input id="telefono" inputMode="numeric" {...register("telefono")} placeholder="3009876543" />
          {errors.telefono && <span className={styles.errorCampo}>{errors.telefono.message}</span>}
        </div>
        <div className={styles.campo}>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} placeholder="contacto@recicladosnorte.com" />
          {errors.email && <span className={styles.errorCampo}>{errors.email.message}</span>}
        </div>
      </div>

      <div className={styles.campo}>
        <Label htmlFor="direccion">Dirección</Label>
        <Input id="direccion" {...register("direccion")} placeholder="Calle 80 # 15-40" />
      </div>

      <div className={styles.acciones}>
        <Button type="button" variant="outline" onClick={alCerrar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={enviando}>
          {enviando ? "Guardando..." : esEdicion ? "Guardar cambios" : "Crear proveedor"}
        </Button>
      </div>
    </form>
  );
}
