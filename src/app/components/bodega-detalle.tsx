import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "./ui/button";
import { ChipEstado } from "./bodega-ui";
import {
  obtenerBodega,
  obtenerUsuariosBodega,
  type Bodega,
  type UsuarioBodega,
} from "../servicios/bodegasApi";
import styles from "./bodega-detalle.module.css";

export function BodegaDetalle() {
  const { id } = useParams<{ id: string }>();
  const navegar = useNavigate();

  const [bodega, setBodega] = useState<Bodega | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioBodega[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setCargando(true);
      setError(null);
      try {
        const [datosBodega, datosUsuarios] = await Promise.all([
          obtenerBodega(id),
          obtenerUsuariosBodega(id).catch(() => []),
        ]);
        setBodega(datosBodega);
        setUsuarios(datosUsuarios);
      } catch (e: any) {
        setError(
          e?.response?.status === 404
            ? "La bodega no existe o fue eliminada."
            : "No se pudo cargar la información de la bodega.",
        );
      } finally {
        setCargando(false);
      }
    })();
  }, [id]);

  if (cargando) return <div className={styles.estado}>Cargando bodega...</div>;
  if (error || !bodega) return <div className={styles.estado}>{error ?? "Bodega no encontrada."}</div>;

  const tieneCoordenadas = bodega.latitud != null && bodega.longitud != null;
  const urlMapa = tieneCoordenadas
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${bodega.longitud! - 0.01}%2C${
        bodega.latitud! - 0.01
      }%2C${bodega.longitud! + 0.01}%2C${bodega.latitud! + 0.01}&layer=mapnik&marker=${
        bodega.latitud
      }%2C${bodega.longitud}`
    : "";

  return (
    <div className={styles.contenedor}>
      <div className={styles.volver}>
        <Button variant="outline" size="sm" onClick={() => navegar("/bodegas")}>
          ← Volver a bodegas
        </Button>
      </div>

      <div className={styles.cabecera}>
        <div>
          <h1 className={styles.titulo}>{bodega.nombre}</h1>
          <ChipEstado estado={bodega.estado} />
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.tarjeta}>
          <h2 className={styles.tarjetaTitulo}>Información general</h2>
          <div className={styles.datos}>
            <div className={styles.dato}>
              <span className={styles.datoEtiqueta}>Tipo de organización</span>
              <span className={styles.datoValor}>{bodega.tipoOrganizacion}</span>
            </div>
            <div className={styles.dato}>
              <span className={styles.datoEtiqueta}>NIT</span>
              <span className={`${styles.datoValor} ${styles.mono}`}>{bodega.nit || "—"}</span>
            </div>
            <div className={styles.dato}>
              <span className={styles.datoEtiqueta}>Dirección</span>
              <span className={styles.datoValor}>{bodega.direccion}</span>
            </div>
            <div className={styles.dato}>
              <span className={styles.datoEtiqueta}>Teléfono</span>
              <span className={`${styles.datoValor} ${styles.mono}`}>{bodega.telefono || "—"}</span>
            </div>
            <div className={styles.dato}>
              <span className={styles.datoEtiqueta}>Email</span>
              <span className={styles.datoValor}>{bodega.email || "—"}</span>
            </div>
          </div>

          {tieneCoordenadas ? (
            <div className={styles.mapa}>
              <iframe title={`Mapa de ${bodega.nombre}`} src={urlMapa} loading="lazy" />
            </div>
          ) : (
            <div className={styles.sinMapa}>Esta bodega no tiene coordenadas registradas.</div>
          )}
        </div>

        <div className={styles.tarjeta}>
          <h2 className={styles.tarjetaTitulo}>Usuarios asignados</h2>
          {usuarios.length === 0 ? (
            <div className={styles.estado}>No hay usuarios asignados a esta bodega.</div>
          ) : (
            <div className={styles.listaUsuarios}>
              {usuarios.map((u) => (
                <div key={u.id} className={styles.usuario}>
                  <span className={styles.usuarioNombre}>{u.nombreCompleto}</span>
                  <span className={styles.usuarioMeta}>
                    @{u.username} · {u.rol} · {u.estado}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
