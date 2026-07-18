import { useEffect, useState } from "react";
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
import styles from "@/app/modules/trabajadores/registrar-trabajador.module.css";

interface Errores {
  [campo: string]: string;
}

const ROL_POR_DEFECTO = "OPERARIO";

export function RegistrarTrabajador({
  alRegistrar,
  alCerrar,
}: {
  alRegistrar: (resultado: RespuestaTrabajadorCreado) => void;
  alCerrar?: () => void;
}) {
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [bodegaId, setBodegaId] = useState("");
  const [rolId, setRolId] = useState("");
  const [password, setPassword] = useState("");
  const [generarAutomatico, setGenerarAutomatico] = useState(true);

  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [errores, setErrores] = useState<Errores>({});
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
        if (rolDefecto) setRolId(rolDefecto.id);
      } catch {
        setErrorGeneral("No se pudieron cargar las bodegas o roles desde el servidor.");
      }
    })();
  }, []);

  function validar(): boolean {
    const nuevos: Errores = {};
    if (nombreCompleto.trim().length < 3) {
      nuevos.nombreCompleto = "El nombre completo debe tener al menos 3 caracteres.";
    }
    if (!username.trim()) {
      nuevos.username = "El username es obligatorio.";
    } else if (/\s/.test(username)) {
      nuevos.username = "El username no puede contener espacios.";
    }
    if (!email.trim()) {
      nuevos.email = "El correo es obligatorio.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nuevos.email = "Ingresa un correo con formato válido.";
    }
    if (telefono && !/^\d+$/.test(telefono)) {
      nuevos.telefono = "El teléfono solo puede contener números.";
    }
    if (!bodegaId) {
      nuevos.bodegaId = "Selecciona una bodega.";
    }
    if (!rolId) {
      nuevos.rolId = "Selecciona un rol.";
    }
    if (!generarAutomatico && password && password.length < 8) {
      nuevos.password = "La contraseña debe tener al menos 8 caracteres.";
    }
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  }

  async function manejarEnvio(evento: React.FormEvent) {
    evento.preventDefault();
    setErrorGeneral(null);
    if (!validar()) return;

    setEnviando(true);
    try {
      const resultado = await registrarTrabajador({
        nombreCompleto: nombreCompleto.trim(),
        username: username.trim(),
        email: email.trim(),
        telefono: telefono.trim() || undefined,
        bodegaId,
        rolId,
        password: generarAutomatico || !password ? undefined : password,
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
    <form className={styles.formulario} onSubmit={manejarEnvio}>
      {errorGeneral && <div className={styles.alertaError}>{errorGeneral}</div>}

      <div className={styles.campo}>
        <Label htmlFor="nombreCompleto">Nombre completo *</Label>
        <Input
          id="nombreCompleto"
          value={nombreCompleto}
          onChange={(e) => setNombreCompleto(e.target.value)}
          placeholder="Ana Torres"
        />
        {errores.nombreCompleto && <span className={styles.errorCampo}>{errores.nombreCompleto}</span>}
      </div>

      <div className={styles.fila}>
        <div className={styles.campo}>
          <Label htmlFor="username">Username *</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="atorres"
          />
          {errores.username && <span className={styles.errorCampo}>{errores.username}</span>}
        </div>
        <div className={styles.campo}>
          <Label htmlFor="telefono">Teléfono</Label>
          <Input
            id="telefono"
            inputMode="numeric"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="3001234567"
          />
          {errores.telefono && <span className={styles.errorCampo}>{errores.telefono}</span>}
        </div>
      </div>

      <div className={styles.campo}>
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ana@sicofar.com"
        />
        {errores.email && <span className={styles.errorCampo}>{errores.email}</span>}
      </div>

      <div className={styles.fila}>
        <div className={styles.campo}>
          <Label>Bodega *</Label>
          <Select value={bodegaId} onValueChange={setBodegaId}>
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
          {errores.bodegaId && <span className={styles.errorCampo}>{errores.bodegaId}</span>}
        </div>
        <div className={styles.campo}>
          <Label>Rol *</Label>
          <Select value={rolId} onValueChange={setRolId}>
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
          {errores.rolId && <span className={styles.errorCampo}>{errores.rolId}</span>}
        </div>
      </div>

      <div className={styles.checkbox}>
        <Checkbox
          id="generarAutomatico"
          checked={generarAutomatico}
          onCheckedChange={(valor) => setGenerarAutomatico(Boolean(valor))}
        />
        <Label htmlFor="generarAutomatico">Generar contraseña automáticamente</Label>
      </div>

      {!generarAutomatico && (
        <div className={styles.campo}>
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
          />
          {errores.password && <span className={styles.errorCampo}>{errores.password}</span>}
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
