import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  obtenerBodegas,
  obtenerRoles,
  registrarTrabajador,
  type Bodega,
  type Rol,
  type RespuestaTrabajadorCreado,
} from "@/app/modules/trabajadores/trabajadoresApi";
import { interpretarErrorHttp } from "@/app/http/errores";
import { trabajadorSchema, type TrabajadorFormValues } from "@/app/modules/trabajadores/trabajadorSchema";
import styles from "@/app/modules/trabajadores/registrar-trabajador.module.css";

const ROL_POR_DEFECTO = "OPERARIO";

export function RegistrarTrabajador({
  alRegistrar,
  alCerrar,
}: {
  alRegistrar: (resultado: RespuestaTrabajadorCreado) => void;
  alCerrar?: () => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TrabajadorFormValues>({
    resolver: zodResolver(trabajadorSchema),
    defaultValues: {
      nombreCompleto: "",
      username: "",
      email: "",
      cedula: "",
      telefono: "",
      bodegaId: "",
      rolId: "",
      password: "",
      generarAutomatico: true,
    },
  });

  const generarAutomatico = watch("generarAutomatico");

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
        // Selecciona el rol "OPERARIO" por defecto si existe.
        const rolDefecto = listaRoles.find(
          (r) => r.nombre.toUpperCase() === ROL_POR_DEFECTO,
        );
        if (rolDefecto) setValue("rolId", rolDefecto.id);
      } catch {
        setErrorGeneral("No se pudieron cargar las bodegas o roles desde el servidor.");
      }
    })();
  }, [setValue]);

  async function onSubmit(valores: TrabajadorFormValues) {
    setErrorGeneral(null);
    setEnviando(true);
    try {
      const resultado = await registrarTrabajador({
        nombreCompleto: valores.nombreCompleto.trim(),
        username: valores.username.trim(),
        email: valores.email.trim(),
        cedula: valores.cedula.trim(),
        telefono: valores.telefono.trim() || undefined,
        bodegaId: valores.bodegaId,
        rolId: valores.rolId,
        password: valores.generarAutomatico || !valores.password ? undefined : valores.password,
      });
      alRegistrar(resultado);
    } catch (error) {
      setErrorGeneral(interpretarErrorHttp(error, {
        409: "Ya existe un usuario con ese correo/usuario.",
        400: "La bodega o el rol seleccionado no son válidos.",
        403: "No tienes permisos de administrador para registrar trabajadores.",
      }, "Ocurrió un error al registrar el trabajador. Intenta de nuevo."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className={styles.formulario} onSubmit={handleSubmit(onSubmit)}>
      {errorGeneral && <div className={styles.alertaError}>{errorGeneral}</div>}

      <div className={styles.campo}>
        <Label htmlFor="nombreCompleto">Nombre completo *</Label>
        <Input
          id="nombreCompleto"
          {...register("nombreCompleto")}
          placeholder="Ana Torres"
        />
        {errors.nombreCompleto && <span className={styles.errorCampo}>{errors.nombreCompleto.message}</span>}
      </div>

      <div className={styles.fila}>
        <div className={styles.campo}>
          <Label htmlFor="username">Username *</Label>
          <Input
            id="username"
            {...register("username")}
            placeholder="atorres"
          />
          {errors.username && <span className={styles.errorCampo}>{errors.username.message}</span>}
        </div>
        <div className={styles.campo}>
          <Label htmlFor="telefono">Teléfono</Label>
          <Input
            id="telefono"
            inputMode="numeric"
            {...register("telefono")}
            placeholder="3001234567"
          />
          {errors.telefono && <span className={styles.errorCampo}>{errors.telefono.message}</span>}
        </div>
      </div>

      <div className={styles.fila}>
        <div className={styles.campo}>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="ana@recyops.com"
          />
          {errors.email && <span className={styles.errorCampo}>{errors.email.message}</span>}
        </div>
        <div className={styles.campo}>
          <Label htmlFor="cedula">Cédula *</Label>
          <Input
            id="cedula"
            inputMode="numeric"
            {...register("cedula")}
            placeholder="1023456789"
          />
          {errors.cedula && <span className={styles.errorCampo}>{errors.cedula.message}</span>}
        </div>
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

      <div className={styles.checkbox}>
        <Controller
          name="generarAutomatico"
          control={control}
          render={({ field }) => (
            <Checkbox
              id="generarAutomatico"
              checked={field.value}
              onCheckedChange={(valor) => field.onChange(Boolean(valor))}
            />
          )}
        />
        <Label htmlFor="generarAutomatico">Generar contraseña automáticamente</Label>
      </div>

      {!generarAutomatico && (
        <div className={styles.campo}>
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            {...register("password")}
            placeholder="Mínimo 8 caracteres"
          />
          {errors.password && <span className={styles.errorCampo}>{errors.password.message}</span>}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        {alCerrar && (
          <Button type="button" variant="outline" onClick={alCerrar}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={enviando}>
          {enviando ? "Registrando..." : "Registrar"}
        </Button>
      </div>
    </form>
  );
}
