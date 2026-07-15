import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Users, ShieldCheck, LogOut, Info, KeyRound } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
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
import { cerrarSesion } from "@/app/modules/auth/authApi";
import styles from "@/app/modules/configuracion/configuracion-vista.module.css";

interface Errores {
  [campo: string]: string;
}

function obtenerIniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function esAdmin(): boolean {
  return (localStorage.getItem("sicofar_rol") || "").toUpperCase() === "ADMIN";
}

function SeccionCabecera({
  icono,
  titulo,
  desc,
  soloAdmin,
  danger,
}: {
  icono: React.ReactNode;
  titulo: string;
  desc: string;
  soloAdmin?: boolean;
  danger?: boolean;
}) {
  return (
    <div className={styles.seccionCabecera}>
      <div className={`${styles.icono} ${danger ? styles.iconoDanger : ""}`}>{icono}</div>
      <div>
        <p className={styles.seccionTitulo}>
          {titulo}
          {soloAdmin && <span className={styles.badgeAdmin2}>ADMIN</span>}
        </p>
        <p className={styles.seccionDesc}>{desc}</p>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Formulario crear operario
────────────────────────────────────────────── */
function FormularioCrearOperario() {
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);

  const [nombre, setNombre] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [bodegaId, setBodegaId] = useState("");
  const [rolId, setRolId] = useState("");

  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [creado, setCreado] = useState<RespuestaTrabajadorCreado | null>(null);

  useEffect(() => {
    obtenerBodegas().then(setBodegas).catch(() => {});
    obtenerRoles().then(setRoles).catch(() => {});
  }, []);

  function validar(): boolean {
    const nuevos: Errores = {};
    if (nombre.trim().length < 3) nuevos.nombre = "El nombre debe tener al menos 3 caracteres.";
    if (!username.trim()) nuevos.username = "El usuario es obligatorio.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nuevos.email = "Correo con formato inválido.";
    if (!bodegaId) nuevos.bodegaId = "Selecciona una bodega.";
    if (!rolId) nuevos.rolId = "Selecciona un rol.";
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  }

  async function manejarEnvio(e: React.FormEvent) {
    e.preventDefault();
    setErrorGeneral(null);
    setCreado(null);
    if (!validar()) return;

    setEnviando(true);
    try {
      const resp = await registrarTrabajador({
        nombreCompleto: nombre.trim(),
        username: username.trim(),
        email: email.trim(),
        telefono: telefono.trim() || undefined,
        bodegaId,
        rolId,
      });
      setCreado(resp);
      setNombre("");
      setUsername("");
      setEmail("");
      setTelefono("");
      setBodegaId("");
      setRolId("");
      setErrores({});
    } catch (err: any) {
      const estado = err?.response?.status;
      if (estado === 409) setErrorGeneral("Ya existe un usuario con ese nombre de usuario o correo.");
      else if (estado === 403) setErrorGeneral("No tienes permisos para crear usuarios.");
      else setErrorGeneral("No se pudo crear el usuario. Verifica los datos e intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  function reiniciar() {
    setCreado(null);
  }

  if (creado) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className={styles.alertaOk}>
          ✓ Usuario <strong>{creado.username}</strong> creado exitosamente.
        </div>
        <div className={styles.credenciales}>
          <div className={styles.credItem}>
            <span className={styles.credLabel}>Usuario</span>
            <span className={styles.credValor}>{creado.username}</span>
          </div>
          <div className={styles.credItem}>
            <span className={styles.credLabel}>Correo</span>
            <span className={styles.credValor}>{creado.email}</span>
          </div>
          {creado.passwordTemporal && (
            <div className={styles.credItem}>
              <span className={styles.credLabel}>Contraseña temp.</span>
              <span className={`${styles.credValor} ${styles.credPassword}`}>
                {creado.passwordTemporal}
              </span>
            </div>
          )}
        </div>
        <p style={{ fontSize: 13, color: "var(--ink-muted)", margin: 0 }}>
          Entrega estas credenciales al trabajador. La contraseña temporal debe cambiarse en el primer ingreso.
        </p>
        <div className={styles.acciones}>
          <Button onClick={reiniciar}>Crear otro usuario</Button>
        </div>
      </div>
    );
  }

  return (
    <form className={styles.formulario} onSubmit={manejarEnvio}>
      {errorGeneral && <div className={styles.alertaError}>{errorGeneral}</div>}

      <div className={styles.fila}>
        <div className={styles.campo}>
          <Label htmlFor="cfg-nombre">Nombre completo *</Label>
          <Input
            id="cfg-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ana Torres Gómez"
          />
          {errores.nombre && <span className={styles.errorCampo}>{errores.nombre}</span>}
        </div>
        <div className={styles.campo}>
          <Label htmlFor="cfg-username">Nombre de usuario *</Label>
          <Input
            id="cfg-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="a.torres"
          />
          {errores.username && <span className={styles.errorCampo}>{errores.username}</span>}
        </div>
      </div>

      <div className={styles.fila}>
        <div className={styles.campo}>
          <Label htmlFor="cfg-email">Correo electrónico *</Label>
          <Input
            id="cfg-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="a.torres@recyops.com"
          />
          {errores.email && <span className={styles.errorCampo}>{errores.email}</span>}
        </div>
        <div className={styles.campo}>
          <Label htmlFor="cfg-telefono">Teléfono</Label>
          <Input
            id="cfg-telefono"
            inputMode="numeric"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="3001234567"
          />
        </div>
      </div>

      <div className={styles.fila}>
        <div className={styles.campo}>
          <Label>Bodega *</Label>
          <Select value={bodegaId} onValueChange={setBodegaId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona bodega" />
            </SelectTrigger>
            <SelectContent>
              {bodegas.length === 0 ? (
                <SelectItem value="__vacio__" disabled>
                  Sin bodegas disponibles
                </SelectItem>
              ) : (
                bodegas.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.nombre}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {errores.bodegaId && <span className={styles.errorCampo}>{errores.bodegaId}</span>}
        </div>
        <div className={styles.campo}>
          <Label>Rol *</Label>
          <Select value={rolId} onValueChange={setRolId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona rol" />
            </SelectTrigger>
            <SelectContent>
              {roles.length === 0 ? (
                <SelectItem value="__vacio__" disabled>
                  Sin roles disponibles
                </SelectItem>
              ) : (
                roles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.nombre}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {errores.rolId && <span className={styles.errorCampo}>{errores.rolId}</span>}
        </div>
      </div>

      <div className={styles.acciones}>
        <Button type="submit" disabled={enviando}>
          {enviando ? "Creando usuario..." : "Crear usuario operario"}
        </Button>
      </div>
    </form>
  );
}

/* ──────────────────────────────────────────────
   Vista principal
────────────────────────────────────────────── */
export function ConfiguracionVista() {
  const navigate = useNavigate();
  const admin = esAdmin();

  const nombre = localStorage.getItem("sicofar_nombre") ?? "Usuario";
  const rol = (localStorage.getItem("sicofar_rol") ?? "OPERARIO").toUpperCase();
  const username = localStorage.getItem("sicofar_username") ?? "—";
  const iniciales = obtenerIniciales(nombre);

  function salir() {
    cerrarSesion();
    navigate("/");
  }

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecera}>
        <h1 className={styles.titulo}>Configuración</h1>
        <p className={styles.subtitulo}>Gestión de cuenta, usuarios y preferencias del sistema.</p>
      </div>

      {/* ── Perfil hero ── */}
      <div className={styles.tarjetaPerfil}>
        <div className={styles.avatarGrande}>{iniciales || "U"}</div>
        <div className={styles.perfilDatos}>
          <p className={styles.perfilNombreGrande}>{nombre}</p>
          <p className={styles.perfilUsername}>@{username}</p>
          <span className={`${styles.badgeRol} ${admin ? styles.badgeAdmin : ""}`}>{rol}</span>
        </div>
      </div>

      {/* ── Información del sistema ── */}
      <div className={styles.seccion}>
        <SeccionCabecera
          icono={<Info size={18} />}
          titulo="Información del sistema"
          desc="Detalles de versión y entorno de la plataforma."
        />
        <div className={styles.seccionCuerpo}>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <p className={styles.infoItemLabel}>Plataforma</p>
              <p className={styles.infoItemValor}>RecyOPS</p>
            </div>
            <div className={styles.infoItem}>
              <p className={styles.infoItemLabel}>Versión</p>
              <p className={styles.infoItemValor}>1.0.0</p>
            </div>
            <div className={styles.infoItem}>
              <p className={styles.infoItemLabel}>Entorno</p>
              <p className={styles.infoItemValor}>Producción</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Seguridad ── */}
      <div className={styles.seccion}>
        <SeccionCabecera
          icono={<KeyRound size={18} />}
          titulo="Seguridad"
          desc="Actualiza tu contraseña de acceso al sistema."
        />
        <div className={styles.seccionCuerpo}>
          <div className={styles.formulario}>
            <div className={styles.fila}>
              <div className={styles.campo}>
                <Label htmlFor="pwd-actual">Contraseña actual</Label>
                <Input id="pwd-actual" type="password" placeholder="••••••••" />
              </div>
              <div className={styles.campo}>
                <Label htmlFor="pwd-nueva">Nueva contraseña</Label>
                <Input id="pwd-nueva" type="password" placeholder="••••••••" />
              </div>
            </div>
            <div className={styles.acciones}>
              <Button variant="outline">Cambiar contraseña</Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Crear operario (solo ADMIN) ── */}
      {admin && (
        <div className={styles.seccion}>
          <SeccionCabecera
            icono={<Users size={18} />}
            titulo="Crear usuario operario"
            desc="Registra un nuevo trabajador operario en la plataforma."
            soloAdmin
          />
          <div className={styles.seccionCuerpo}>
            <FormularioCrearOperario />
          </div>
        </div>
      )}

      {/* ── Permisos del rol ── */}
      <div className={styles.seccion}>
        <SeccionCabecera
          icono={<ShieldCheck size={18} />}
          titulo="Permisos de tu cuenta"
          desc="Acciones habilitadas según tu rol actual en el sistema."
        />
        <div className={styles.seccionCuerpo}>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <p className={styles.infoItemLabel}>Consultar datos</p>
              <p className={styles.infoItemValor} style={{ color: "#166534" }}>✓ Habilitado</p>
            </div>
            <div className={styles.infoItem}>
              <p className={styles.infoItemLabel}>Registrar ingresos</p>
              <p className={styles.infoItemValor} style={{ color: "#166534" }}>✓ Habilitado</p>
            </div>
            <div className={styles.infoItem}>
              <p className={styles.infoItemLabel}>Administrar entidades</p>
              <p className={styles.infoItemValor} style={{ color: admin ? "#166534" : "#b42318" }}>
                {admin ? "✓ Habilitado" : "✗ Solo ADMIN"}
              </p>
            </div>
            <div className={styles.infoItem}>
              <p className={styles.infoItemLabel}>Crear usuarios</p>
              <p className={styles.infoItemValor} style={{ color: admin ? "#166534" : "#b42318" }}>
                {admin ? "✓ Habilitado" : "✗ Solo ADMIN"}
              </p>
            </div>
            <div className={styles.infoItem}>
              <p className={styles.infoItemLabel}>Ver logs del sistema</p>
              <p className={styles.infoItemValor} style={{ color: admin ? "#166534" : "#b42318" }}>
                {admin ? "✓ Habilitado" : "✗ Solo ADMIN"}
              </p>
            </div>
            <div className={styles.infoItem}>
              <p className={styles.infoItemLabel}>Configuración</p>
              <p className={styles.infoItemValor} style={{ color: admin ? "#166534" : "#b42318" }}>
                {admin ? "✓ Completa" : "Limitada"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Cerrar sesión ── */}
      <div className={styles.seccion}>
        <SeccionCabecera
          icono={<LogOut size={18} />}
          titulo="Cerrar sesión"
          desc="Termina tu sesión activa y regresa a la pantalla de inicio de sesión."
          danger
        />
        <div className={styles.seccionCuerpo}>
          <div className={styles.filaAccion}>
            <p className={styles.accionDesc}>
              Al cerrar sesión perderás acceso al panel hasta que vuelvas a autenticarte.
            </p>
            <Button
              variant="outline"
              style={{ borderColor: "#f3b9b3", color: "#b42318", whiteSpace: "nowrap" }}
              onClick={salir}
            >
              <LogOut size={15} />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
