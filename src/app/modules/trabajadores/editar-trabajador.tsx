import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  actualizarTrabajador,
  obtenerBodegas,
  obtenerRoles,
  type Bodega,
  type Rol,
  type Trabajador,
} from "@/app/modules/trabajadores/trabajadoresApi";
import { interpretarErrorHttp } from "@/app/http/errores";
import {
  editarTrabajadorSchema,
  type EditarTrabajadorFormValues,
} from "@/app/modules/trabajadores/trabajadorSchema";
import styles from "@/app/modules/trabajadores/registrar-trabajador.module.css";

/** Edición de un trabajador. El email y el username son identidad y no se tocan. */
export function EditarTrabajador({
  trabajador,
  alGuardar,
  alCerrar,
}: {
  trabajador: Trabajador;
  alGuardar: (actualizado: Trabajador) => void;
  alCerrar?: () => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EditarTrabajadorFormValues>({
    resolver: zodResolver(editarTrabajadorSchema),
    defaultValues: {
      nombreCompleto: trabajador.nombreCompleto,
      cedula: trabajador.cedula ?? "",
      telefono: trabajador.telefono ?? "",
      bodegaId: trabajador.bodegaId ?? "",
      rolId: trabajador.rolId,
    },
  });

  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [listaBodegas, listaRoles] = await Promise.all([obtenerBodegas(), obtenerRoles()]);
        setBodegas(listaBodegas);
        setRoles(listaRoles);
      } catch {
        setErrorGeneral("No se pudieron cargar las bodegas o roles desde el servidor.");
      }
    })();
  }, []);

  async function onSubmit(valores: EditarTrabajadorFormValues) {
    setErrorGeneral(null);
    setEnviando(true);
    try {
      const actualizado = await actualizarTrabajador(trabajador.id, {
        nombreCompleto: valores.nombreCompleto.trim(),
        cedula: valores.cedula.trim(),
        telefono: valores.telefono.trim() || null,
        bodegaId: valores.bodegaId,
        rolId: valores.rolId,
      });
      alGuardar(actualizado);
    } catch (error) {
      setErrorGeneral(interpretarErrorHttp(error, {
        404: "El trabajador ya no existe.",
        403: "No tienes permisos para editar trabajadores.",
        502: "No se pudo sincronizar con Supabase. Intenta de nuevo.",
      }, "Ocurrió un error al guardar los cambios. Intenta de nuevo."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className={styles.formulario} onSubmit={handleSubmit(onSubmit)}>
      {errorGeneral && <div className={styles.alertaError}>{errorGeneral}</div>}

      <div className={styles.fila}>
        <div className={styles.campo}>
          <Label>Username</Label>
          <Input value={trabajador.username} disabled />
        </div>
        <div className={styles.campo}>
          <Label>Email</Label>
          <Input value={trabajador.email} disabled />
        </div>
      </div>

      <div className={styles.campo}>
        <Label htmlFor="editNombre">Nombre completo *</Label>
        <Input
          id="editNombre"
          {...register("nombreCompleto")}
        />
        {errors.nombreCompleto && <span className={styles.errorCampo}>{errors.nombreCompleto.message}</span>}
      </div>

      <div className={styles.campo}>
        <Label htmlFor="editCedula">Cédula *</Label>
        <Input
          id="editCedula"
          inputMode="numeric"
          {...register("cedula")}
        />
        {errors.cedula && <span className={styles.errorCampo}>{errors.cedula.message}</span>}
      </div>

      <div className={styles.campo}>
        <Label htmlFor="editTelefono">Teléfono</Label>
        <Input
          id="editTelefono"
          inputMode="numeric"
          {...register("telefono")}
        />
        {errors.telefono && <span className={styles.errorCampo}>{errors.telefono.message}</span>}
      </div>

      <div className={styles.fila}>
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
                  {bodegas.map((bodega) => (
                    <SelectItem key={bodega.id} value={bodega.id}>
                      {bodega.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.bodegaId && <span className={styles.errorCampo}>{errors.bodegaId.message}</span>}
        </div>
        <div className={styles.campo}>
          <Label>Rol *</Label>
          <Controller
            name="rolId"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((rol) => (
                    <SelectItem key={rol.id} value={rol.id}>
                      {rol.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.rolId && <span className={styles.errorCampo}>{errors.rolId.message}</span>}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        {alCerrar && (
          <Button type="button" variant="outline" onClick={alCerrar}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={enviando}>
          {enviando ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
