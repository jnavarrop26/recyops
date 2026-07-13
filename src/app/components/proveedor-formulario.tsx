import { useState } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import {
  crearProveedor,
  actualizarProveedor,
  type Proveedor,
  type CuerpoProveedor,
} from "../servicios/proveedoresApi";
import styles from "./material-formulario.module.css";

interface Errores {
  [campo: string]: string;
}

export function ProveedorFormulario({
  proveedor,
  alGuardar,
  alCerrar,
}: {
  proveedor?: Proveedor | null;
  alGuardar: (resultado: Proveedor) => void;
  alCerrar: () => void;
}) {
  const esEdicion = Boolean(proveedor);

  const [nombre, setNombre] = useState(proveedor?.nombre ?? "");
  const [nit, setNit] = useState(proveedor?.nit ?? "");
  const [contacto, setContacto] = useState(proveedor?.contacto ?? "");
  const [telefono, setTelefono] = useState(proveedor?.telefono ?? "");
  const [email, setEmail] = useState(proveedor?.email ?? "");
  const [direccion, setDireccion] = useState(proveedor?.direccion ?? "");

  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function validar(): boolean {
    const nuevos: Errores = {};
    if (nombre.trim().length < 3) nuevos.nombre = "El nombre debe tener al menos 3 caracteres.";
    if (!nit.trim()) nuevos.nit = "El NIT es obligatorio.";
    if (telefono && !/^\d+$/.test(telefono)) nuevos.telefono = "El teléfono solo puede contener números.";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nuevos.email = "Ingresa un correo con formato válido.";
    }
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  }

  async function manejarEnvio(evento: React.FormEvent) {
    evento.preventDefault();
    setErrorGeneral(null);
    if (!validar()) return;

    const cuerpo: CuerpoProveedor = {
      nombre: nombre.trim(),
      nit: nit.trim(),
      contacto: contacto.trim() || null,
      telefono: telefono.trim() || null,
      email: email.trim() || null,
      direccion: direccion.trim() || null,
    };

    setEnviando(true);
    try {
      const resultado = esEdicion
        ? await actualizarProveedor(proveedor!.id, cuerpo)
        : await crearProveedor(cuerpo);
      alGuardar(resultado);
    } catch (error: any) {
      const estado = error?.response?.status;
      if (estado === 409) {
        setErrores((prev) => ({ ...prev, nit: "Ya existe un proveedor con ese NIT." }));
        setErrorGeneral("Ya existe un proveedor con ese NIT.");
      } else if (estado === 400) setErrorGeneral("Revisa los datos del formulario.");
      else if (estado === 403) setErrorGeneral("No tienes permisos para esta acción.");
      else if (estado === 404) setErrorGeneral("El proveedor no existe o fue eliminado.");
      else setErrorGeneral("Ocurrió un error al guardar el proveedor. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className={styles.formulario} onSubmit={manejarEnvio}>
      {errorGeneral && <div className={styles.alertaError}>{errorGeneral}</div>}

      <div className={styles.campo}>
        <Label htmlFor="nombre">Nombre *</Label>
        <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Reciclados del Norte S.A.S" />
        {errores.nombre && <span className={styles.errorCampo}>{errores.nombre}</span>}
      </div>

      <div className={styles.fila}>
        <div className={styles.campo}>
          <Label htmlFor="nit">NIT *</Label>
          <Input id="nit" value={nit} onChange={(e) => setNit(e.target.value)} placeholder="901234567-8" />
          {errores.nit && <span className={styles.errorCampo}>{errores.nit}</span>}
        </div>
        <div className={styles.campo}>
          <Label htmlFor="contacto">Contacto</Label>
          <Input id="contacto" value={contacto} onChange={(e) => setContacto(e.target.value)} placeholder="María Gómez" />
        </div>
      </div>

      <div className={styles.fila}>
        <div className={styles.campo}>
          <Label htmlFor="telefono">Teléfono</Label>
          <Input id="telefono" inputMode="numeric" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="3009876543" />
          {errores.telefono && <span className={styles.errorCampo}>{errores.telefono}</span>}
        </div>
        <div className={styles.campo}>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contacto@recicladosnorte.com" />
          {errores.email && <span className={styles.errorCampo}>{errores.email}</span>}
        </div>
      </div>

      <div className={styles.campo}>
        <Label htmlFor="direccion">Dirección</Label>
        <Input id="direccion" value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Calle 80 # 15-40" />
      </div>

      <div className={styles.acciones}>
        <Button type="button" variant="outline" onClick={alCerrar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={enviando}>
          {enviando ? "Guardando..." : esEdicion ? "Guardar cambios" : "Crear proveedor"}
        </Button>
      </div>
    </form>
  );
}
