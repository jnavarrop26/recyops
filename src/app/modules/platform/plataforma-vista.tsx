import { useState } from "react";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import {
  provisionarEmpresa,
  type RespuestaEmpresaCreada,
} from "@/app/modules/platform/plataformaApi";
import styles from "@/app/modules/platform/plataforma-vista.module.css";

interface Errores {
  [campo: string]: string;
}

const SCHEMA_RE = /^[a-z][a-z0-9_]{1,62}$/;

export function PlataformaVista() {
  const [nombre, setNombre] = useState("");
  const [nit, setNit] = useState("");
  const [schemaNombre, setSchemaNombre] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminNombreCompleto, setAdminNombreCompleto] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [generarPassword, setGenerarPassword] = useState(true);

  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<RespuestaEmpresaCreada | null>(null);

  function validar(): boolean {
    const e: Errores = {};
    if (nombre.trim().length < 3) e.nombre = "El nombre debe tener al menos 3 caracteres.";
    if (!nit.trim()) e.nit = "El NIT es obligatorio.";
    if (!SCHEMA_RE.test(schemaNombre))
      e.schemaNombre =
        "Solo minúsculas, números y guion bajo. Debe iniciar con letra (ej: empresa_ecoverde).";
    if (!adminEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail))
      e.adminEmail = "Correo del admin no válido.";
    if (adminNombreCompleto.trim().length < 3)
      e.adminNombreCompleto = "El nombre completo debe tener al menos 3 caracteres.";
    if (!adminUsername.trim() || /\s/.test(adminUsername))
      e.adminUsername = "El username es obligatorio y sin espacios.";
    if (!generarPassword && adminPassword.length > 0 && adminPassword.length < 8)
      e.adminPassword = "La contraseña debe tener al menos 8 caracteres.";
    setErrores(e);
    return Object.keys(e).length === 0;
  }

  async function manejarEnvio(evento: React.FormEvent) {
    evento.preventDefault();
    setErrorGeneral(null);
    if (!validar()) return;

    setEnviando(true);
    try {
      const resp = await provisionarEmpresa({
        nombre: nombre.trim(),
        nit: nit.trim(),
        schemaNombre: schemaNombre.trim(),
        adminEmail: adminEmail.trim(),
        adminNombreCompleto: adminNombreCompleto.trim(),
        adminUsername: adminUsername.trim(),
        adminPassword: generarPassword || !adminPassword ? undefined : adminPassword,
      });
      setResultado(resp);
      resetFormulario();
    } catch (error: any) {
      const estado = error?.response?.status;
      const mensaje = error?.response?.data?.mensaje;
      if (estado === 409) {
        setErrorGeneral(mensaje ?? "Ya existe una empresa con ese NIT o nombre de esquema.");
      } else if (estado === 400) {
        setErrorGeneral(mensaje ?? "Datos inválidos. Revisa los campos.");
      } else {
        setErrorGeneral("Error al crear la empresa. Intenta de nuevo.");
      }
    } finally {
      setEnviando(false);
    }
  }

  function resetFormulario() {
    setNombre("");
    setNit("");
    setSchemaNombre("");
    setAdminEmail("");
    setAdminNombreCompleto("");
    setAdminUsername("");
    setAdminPassword("");
    setGenerarPassword(true);
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
        <form className={styles.formulario} onSubmit={manejarEnvio}>
          {errorGeneral && <div className={styles.alertaError}>{errorGeneral}</div>}

          <p className={styles.seccion}>Datos de la empresa</p>

          <div className={styles.campo}>
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="EcoVerde S.A.S"
            />
            {errores.nombre && <span className={styles.errorCampo}>{errores.nombre}</span>}
          </div>

          <div className={styles.fila}>
            <div className={styles.campo}>
              <Label htmlFor="nit">NIT *</Label>
              <Input
                id="nit"
                value={nit}
                onChange={(e) => setNit(e.target.value)}
                placeholder="900123456-1"
              />
              {errores.nit && <span className={styles.errorCampo}>{errores.nit}</span>}
            </div>
            <div className={styles.campo}>
              <Label htmlFor="schemaNombre">Schema de BD *</Label>
              <Input
                id="schemaNombre"
                value={schemaNombre}
                onChange={(e) => setSchemaNombre(e.target.value.toLowerCase().replace(/\s/g, "_"))}
                placeholder="empresa_ecoverde"
              />
              {errores.schemaNombre && (
                <span className={styles.errorCampo}>{errores.schemaNombre}</span>
              )}
            </div>
          </div>

          <p className={styles.seccion}>Primer administrador</p>

          <div className={styles.campo}>
            <Label htmlFor="adminNombreCompleto">Nombre completo *</Label>
            <Input
              id="adminNombreCompleto"
              value={adminNombreCompleto}
              onChange={(e) => setAdminNombreCompleto(e.target.value)}
              placeholder="Carlos Ruiz"
            />
            {errores.adminNombreCompleto && (
              <span className={styles.errorCampo}>{errores.adminNombreCompleto}</span>
            )}
          </div>

          <div className={styles.fila}>
            <div className={styles.campo}>
              <Label htmlFor="adminEmail">Correo *</Label>
              <Input
                id="adminEmail"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@ecoverde.com"
              />
              {errores.adminEmail && (
                <span className={styles.errorCampo}>{errores.adminEmail}</span>
              )}
            </div>
            <div className={styles.campo}>
              <Label htmlFor="adminUsername">Username *</Label>
              <Input
                id="adminUsername"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                placeholder="cruiz"
              />
              {errores.adminUsername && (
                <span className={styles.errorCampo}>{errores.adminUsername}</span>
              )}
            </div>
          </div>

          <div className={styles.checkbox}>
            <Checkbox
              id="generarPassword"
              checked={generarPassword}
              onCheckedChange={(v) => setGenerarPassword(Boolean(v))}
            />
            <Label htmlFor="generarPassword">Generar contraseña automáticamente</Label>
          </div>

          {!generarPassword && (
            <div className={styles.campo}>
              <Label htmlFor="adminPassword">Contraseña</Label>
              <Input
                id="adminPassword"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
              />
              {errores.adminPassword && (
                <span className={styles.errorCampo}>{errores.adminPassword}</span>
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
