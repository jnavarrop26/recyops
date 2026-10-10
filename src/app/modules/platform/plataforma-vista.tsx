import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import {
  provisionarEmpresa,
  type RespuestaEmpresaCreada,
} from "@/app/modules/platform/plataformaApi";
import { estadoHttp, mensajeDelServidor } from "@/app/http/errores";
import { plataformaSchema, type PlataformaFormValues } from "@/app/modules/platform/plataformaSchema";
import styles from "@/app/modules/platform/plataforma-vista.module.css";

export function PlataformaVista() {
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<PlataformaFormValues>({
    resolver: zodResolver(plataformaSchema),
    defaultValues: {
      nombre: "",
      nit: "",
      schemaNombre: "",
      adminEmail: "",
      adminNombreCompleto: "",
      adminUsername: "",
      adminPassword: "",
      generarPassword: true,
    },
  });

  const generarPassword = watch("generarPassword");

  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<RespuestaEmpresaCreada | null>(null);

  async function onSubmit(valores: PlataformaFormValues) {
    setErrorGeneral(null);

    setEnviando(true);
    try {
      const resp = await provisionarEmpresa({
        nombre: valores.nombre.trim(),
        nit: valores.nit.trim(),
        schemaNombre: valores.schemaNombre.trim(),
        adminEmail: valores.adminEmail.trim(),
        adminNombreCompleto: valores.adminNombreCompleto.trim(),
        adminUsername: valores.adminUsername.trim(),
        adminPassword: valores.generarPassword || !valores.adminPassword ? undefined : valores.adminPassword,
      });
      setResultado(resp);
      reset({
        nombre: "",
        nit: "",
        schemaNombre: "",
        adminEmail: "",
        adminNombreCompleto: "",
        adminUsername: "",
        adminPassword: "",
        generarPassword: true,
      });
    } catch (error) {
      const estado = estadoHttp(error);
      if (estado === 409) {
        setErrorGeneral(mensajeDelServidor(error) ?? "Ya existe una empresa con ese NIT o nombre de esquema.");
      } else if (estado === 400) {
        setErrorGeneral(mensajeDelServidor(error) ?? "Datos inválidos. Revisa los campos.");
      } else {
        setErrorGeneral("Error al crear la empresa. Intenta de nuevo.");
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className={styles.pagina}>
      <div className={styles.encabezado}>
        <h1>Panel de Plataforma</h1>
        <p>Provisiona nuevas empresas y crea su primer usuario administrador.</p>
      </div>

      {resultado && (
        <div className={styles.resultado}>
          <h2>Empresa creada exitosamente</h2>
          <div className={styles["fila-dato"]}>
            <span>Empresa</span>
            <span>{resultado.nombre}</span>
          </div>
          <div className={styles["fila-dato"]}>
            <span>NIT</span>
            <span>{resultado.nit}</span>
          </div>
          <div className={styles["fila-dato"]}>
            <span>Schema</span>
            <span>{resultado.schemaNombre}</span>
          </div>
          <div className={styles["fila-dato"]}>
            <span>Email admin</span>
            <span>{resultado.adminEmail}</span>
          </div>
          {resultado.passwordTemporal && (
            <div className={styles["fila-dato"]}>
              <span>Contraseña temporal</span>
              <span>{resultado.passwordTemporal}</span>
            </div>
          )}
          <p className={styles.aviso}>
            {resultado.passwordTemporal
              ? "Comparte esta contraseña con el admin de forma segura. No se volverá a mostrar."
              : "El admin podrá iniciar sesión con la contraseña que definiste."}
          </p>
          <Button variant="outline" size="sm" onClick={() => setResultado(null)}>
            Crear otra empresa
          </Button>
        </div>
      )}

      <div className={styles.tarjeta}>
        <h2>Nueva Empresa</h2>
        <form className={styles.formulario} onSubmit={handleSubmit(onSubmit)}>
          {errorGeneral && <div className={styles.alertaError} role="alert">{errorGeneral}</div>}

          <p className={styles.seccion}>Datos de la empresa</p>

          <div className={styles.campo}>
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              aria-invalid={!!errors.nombre}
              aria-describedby={errors.nombre ? "nombre-error" : undefined}
              {...register("nombre")}
              placeholder="EcoVerde S.A.S"
            />
            {errors.nombre && <span id="nombre-error" role="alert" className={styles.errorCampo}>{errors.nombre.message}</span>}
          </div>

          <div className={styles.fila}>
            <div className={styles.campo}>
              <Label htmlFor="nit">NIT *</Label>
              <Input
                id="nit"
                aria-invalid={!!errors.nit}
                aria-describedby={errors.nit ? "nit-error" : undefined}
                {...register("nit")}
                placeholder="900123456-1"
              />
              {errors.nit && <span id="nit-error" role="alert" className={styles.errorCampo}>{errors.nit.message}</span>}
            </div>
            <div className={styles.campo}>
              <Label htmlFor="schemaNombre">Schema de BD *</Label>
              <Controller
                name="schemaNombre"
                control={control}
                render={({ field }) => (
                  <Input
                    id="schemaNombre"
                    aria-invalid={!!errors.schemaNombre}
                    aria-describedby={errors.schemaNombre ? "schemaNombre-error" : undefined}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value.toLowerCase().replace(/\s/g, "_"))}
                    placeholder="empresa_ecoverde"
                  />
                )}
              />
              {errors.schemaNombre && (
                <span id="schemaNombre-error" role="alert" className={styles.errorCampo}>{errors.schemaNombre.message}</span>
              )}
            </div>
          </div>

          <p className={styles.seccion}>Primer administrador</p>

          <div className={styles.campo}>
            <Label htmlFor="adminNombreCompleto">Nombre completo *</Label>
            <Input
              id="adminNombreCompleto"
              aria-invalid={!!errors.adminNombreCompleto}
              aria-describedby={errors.adminNombreCompleto ? "adminNombreCompleto-error" : undefined}
              {...register("adminNombreCompleto")}
              placeholder="Carlos Ruiz"
            />
            {errors.adminNombreCompleto && (
              <span id="adminNombreCompleto-error" role="alert" className={styles.errorCampo}>{errors.adminNombreCompleto.message}</span>
            )}
          </div>

          <div className={styles.fila}>
            <div className={styles.campo}>
              <Label htmlFor="adminEmail">Correo *</Label>
              <Input
                id="adminEmail"
                aria-invalid={!!errors.adminEmail}
                aria-describedby={errors.adminEmail ? "adminEmail-error" : undefined}
                type="email"
                {...register("adminEmail")}
                placeholder="admin@ecoverde.com"
              />
              {errors.adminEmail && (
                <span id="adminEmail-error" role="alert" className={styles.errorCampo}>{errors.adminEmail.message}</span>
              )}
            </div>
            <div className={styles.campo}>
              <Label htmlFor="adminUsername">Username *</Label>
              <Input
                id="adminUsername"
                aria-invalid={!!errors.adminUsername}
                aria-describedby={errors.adminUsername ? "adminUsername-error" : undefined}
                {...register("adminUsername")}
                placeholder="cruiz"
              />
              {errors.adminUsername && (
                <span id="adminUsername-error" role="alert" className={styles.errorCampo}>{errors.adminUsername.message}</span>
              )}
            </div>
          </div>

          <div className={styles.checkbox}>
            <Controller
              name="generarPassword"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="generarPassword"
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(Boolean(v))}
                />
              )}
            />
            <Label htmlFor="generarPassword">Generar contraseña automáticamente</Label>
          </div>

          {!generarPassword && (
            <div className={styles.campo}>
              <Label htmlFor="adminPassword">Contraseña</Label>
              <Input
                id="adminPassword"
                aria-invalid={!!errors.adminPassword}
                aria-describedby={errors.adminPassword ? "adminPassword-error" : undefined}
                type="password"
                autoComplete="new-password"
                {...register("adminPassword")}
                placeholder="Mínimo 8 caracteres"
              />
              {errors.adminPassword && (
                <span id="adminPassword-error" role="alert" className={styles.errorCampo}>{errors.adminPassword.message}</span>
              )}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <Button type="submit" disabled={enviando}>
              {enviando ? "Creando empresa..." : "Crear empresa"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
