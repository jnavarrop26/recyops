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
  actualizarTrabajador,
  obtenerBodegas,
  obtenerRoles,
  type Bodega,
  type Rol,
  type Trabajador,
} from "@/app/modules/trabajadores/trabajadoresApi";
import { interpretarErrorHttp } from "@/app/http/errores";
import styles from "@/app/modules/trabajadores/registrar-trabajador.module.css";

interface Errores {
  [campo: string]: string;
}

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
  const [nombreCompleto, setNombreCompleto] = useState(trabajador.nombreCompleto);
  const [telefono, setTelefono] = useState(trabajador.telefono ?? "");
  const [bodegaId, setBodegaId] = useState(trabajador.bodegaId ?? "");
  const [rolId, setRolId] = useState(trabajador.rolId);

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
    if (telefono && !/^\d+$/.test(telefono)) {
      nuevos.telefono = "El teléfono solo puede contener números.";
    }
    if (!bodegaId) nuevos.bodegaId = "Selecciona una bodega.";
    if (!rolId) nuevos.rolId = "Selecciona un rol.";
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  }

  async function manejarEnvio(evento: React.FormEvent) {
    evento.preventDefault();
    setErrorGeneral(null);
    if (!validar()) return;

    setEnviando(true);
    try {
      const actualizado = await actualizarTrabajador(trabajador.id, {
        nombreCompleto: nombreCompleto.trim(),
        telefono: telefono.trim() || null,
        bodegaId,
        rolId,
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
    <form className={styles.formulario} onSubmit={manejarEnvio}>
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
          value={nombreCompleto}
          onChange={(e) => setNombreCompleto(e.target.value)}
        />
        {errores.nombreCompleto && <span className={styles.errorCampo}>{errores.nombreCompleto}</span>}
      </div>

      <div className={styles.campo}>
        <Label htmlFor="editTelefono">Teléfono</Label>
        <Input
          id="editTelefono"
          inputMode="numeric"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
        />
        {errores.telefono && <span className={styles.errorCampo}>{errores.telefono}</span>}
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
