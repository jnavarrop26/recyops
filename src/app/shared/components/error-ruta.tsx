import { isRouteErrorResponse, Link, useRouteError } from "react-router";
import { AlertTriangle, Home, RotateCcw, SearchX } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import styles from "@/app/shared/components/error-ruta.module.css";

// Destino de "Volver al inicio": con sesión, el inicio del dashboard;
// sin sesión, el login.
function rutaInicio() {
  return localStorage.getItem("recyops_token") ? "/inicio" : "/";
}

/**
 * Pantalla de error para `errorElement` de las rutas. Reemplaza la pantalla
 * por defecto de React Router cuando una vista lanza una excepción al
 * renderizar, con opción de reintentar o volver al inicio.
 */
export function ErrorRuta() {
  const error = useRouteError();
  const noEncontrada = isRouteErrorResponse(error) && error.status === 404;

  if (import.meta.env.DEV) console.error(error);

  if (noEncontrada) return <NoEncontrada />;

  return (
    <div className={styles.contenedor} role="alert">
      <AlertTriangle className={styles.icono} size={36} aria-hidden="true" />
      <h1 className={styles.titulo}>Algo salió mal</h1>
      <p className={styles.mensaje}>
        Ocurrió un error inesperado al mostrar esta sección. Puedes intentar
        de nuevo o volver al inicio.
      </p>
      <div className={styles.acciones}>
        <Button type="button" onClick={() => window.location.reload()}>
          <RotateCcw aria-hidden="true" />
          Reintentar
        </Button>
        <Button asChild variant="outline">
          <Link to={rutaInicio()}>
            <Home aria-hidden="true" />
            Volver al inicio
          </Link>
        </Button>
      </div>
    </div>
  );
}

/** Ruta desconocida dentro del dashboard (usuario con sesión). */
export function NoEncontrada() {
  return (
    <div className={styles.contenedor}>
      <SearchX className={styles.icono} size={36} aria-hidden="true" />
      <h1 className={styles.titulo}>Página no encontrada</h1>
      <p className={styles.mensaje}>
        La dirección que abriste no existe o fue movida.
      </p>
      <div className={styles.acciones}>
        <Button asChild>
          <Link to={rutaInicio()}>
            <Home aria-hidden="true" />
            Volver al inicio
          </Link>
        </Button>
      </div>
    </div>
  );
}
