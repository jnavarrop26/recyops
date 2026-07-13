import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { RegistrarTrabajador } from "./registrar-trabajador";
import { EditarTrabajador } from "./editar-trabajador";
import {
  cambiarEstadoTrabajador,
  obtenerTrabajadores,
  type Trabajador,
  type RespuestaTrabajadorCreado,
} from "../servicios/trabajadoresApi";
import styles from "./trabajadores-vista.module.css";

export function TrabajadoresVista() {
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalRegistroAbierto, setModalRegistroAbierto] = useState(false);
  const [credenciales, setCredenciales] = useState<RespuestaTrabajadorCreado | null>(null);
  const [editando, setEditando] = useState<Trabajador | null>(null);
  const [cambiandoEstado, setCambiandoEstado] = useState<string | null>(null);

  async function cargarTrabajadores() {
    setCargando(true);
    setError(null);
    try {
      const datos = await obtenerTrabajadores();
      setTrabajadores(Array.isArray(datos) ? datos : []);
    } catch {
      setError("No se pudo cargar la lista de trabajadores.");
      setTrabajadores([]);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarTrabajadores();
  }, []);

  function manejarRegistro(resultado: RespuestaTrabajadorCreado) {
    setModalRegistroAbierto(false);
    // Refresca la lista tras crear el usuario.
    cargarTrabajadores();
    // Si el backend generó una contraseña temporal, se muestra una sola vez.
    if (resultado.passwordTemporal) {
      setCredenciales(resultado);
    }
  }

  function manejarEdicion(actualizado: Trabajador) {
    setEditando(null);
    setTrabajadores((lista) => lista.map((t) => (t.id === actualizado.id ? actualizado : t)));
  }

  async function alternarEstado(trabajador: Trabajador) {
    const desactivar = trabajador.estado === "ACTIVO";
    const confirmacion = desactivar
      ? `¿Desactivar a ${trabajador.nombreCompleto}? No podrá iniciar sesión hasta reactivarlo.`
      : `¿Reactivar a ${trabajador.nombreCompleto}? Podrá volver a iniciar sesión.`;
    if (!window.confirm(confirmacion)) return;

    setCambiandoEstado(trabajador.id);
    setError(null);
    try {
      const actualizado = await cambiarEstadoTrabajador(
        trabajador.id,
        desactivar ? "INACTIVO" : "ACTIVO",
      );
      setTrabajadores((lista) => lista.map((t) => (t.id === actualizado.id ? actualizado : t)));
    } catch {
      setError("No se pudo cambiar el estado del trabajador. Intenta de nuevo.");
    } finally {
      setCambiandoEstado(null);
    }
  }

  return (
    <div className={styles.contenedor}>
      <div className={styles.cabecera}>
        <div>
          <h1 className={styles.titulo}>Trabajadores</h1>
          <p className={styles.subtitulo}>Gestión del personal de la bodega.</p>
        </div>
        <Button onClick={() => setModalRegistroAbierto(true)}>Nuevo trabajador</Button>
      </div>

      <div className={styles.tarjeta}>
        {cargando ? (
          <div className={styles.estado}>Cargando trabajadores...</div>
        ) : error ? (
          <div className={styles.estado}>{error}</div>
        ) : trabajadores.length === 0 ? (
          <div className={styles.estado}>No hay trabajadores registrados.</div>
        ) : (
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th>Nombre completo</th>
                <th>Username</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Bodega</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {trabajadores.map((trabajador) => (
                <tr key={trabajador.id}>
                  <td>{trabajador.nombreCompleto}</td>
                  <td className={styles.mono}>{trabajador.username}</td>
                  <td>{trabajador.email}</td>
                  <td>{trabajador.rolNombre}</td>
                  <td>{trabajador.bodegaNombre ?? "—"}</td>
                  <td>{trabajador.estado}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditando(trabajador)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={cambiandoEstado === trabajador.id}
                        onClick={() => alternarEstado(trabajador)}
                      >
                        {cambiandoEstado === trabajador.id
                          ? "..."
                          : trabajador.estado === "ACTIVO"
                            ? "Desactivar"
                            : "Reactivar"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: formulario de registro */}
      <Dialog open={modalRegistroAbierto} onOpenChange={setModalRegistroAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar trabajador</DialogTitle>
            <DialogDescription>
              Completa los datos del nuevo trabajador. Los campos con * son obligatorios.
            </DialogDescription>
          </DialogHeader>
          <RegistrarTrabajador
            alRegistrar={manejarRegistro}
            alCerrar={() => setModalRegistroAbierto(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal: edición de trabajador */}
      <Dialog open={editando !== null} onOpenChange={(abierto) => !abierto && setEditando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar trabajador</DialogTitle>
            <DialogDescription>
              Cambia el nombre, teléfono, bodega o rol. El usuario y el email no se editan.
            </DialogDescription>
          </DialogHeader>
          {editando && (
            <EditarTrabajador
              trabajador={editando}
              alGuardar={manejarEdicion}
              alCerrar={() => setEditando(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: credenciales temporales (se muestran una sola vez) */}
      <Dialog open={credenciales !== null} onOpenChange={(abierto) => !abierto && setCredenciales(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Credenciales del trabajador</DialogTitle>
            <DialogDescription>
              Entrega estas credenciales al trabajador. No se volverán a mostrar.
            </DialogDescription>
          </DialogHeader>
          {credenciales && (
            <div className={styles.credenciales}>
              <div className={styles.credLinea}>
                <span>Usuario</span>
                <span>{credenciales.username}</span>
              </div>
              <div className={styles.credLinea}>
                <span>Email</span>
                <span>{credenciales.email}</span>
              </div>
              <div className={styles.credLinea}>
                <span>Contraseña temporal</span>
                <span>{credenciales.passwordTemporal}</span>
              </div>
            </div>
          )}
          <p className={styles.aviso}>
            Asegúrate de copiarlas ahora; por seguridad no se mostrarán nuevamente.
          </p>
          <DialogFooter>
            <Button onClick={() => setCredenciales(null)}>Entendido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
