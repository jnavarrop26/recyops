import { useState } from "react";
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
  crearBodega,
  actualizarBodega,
  TIPOS_ORGANIZACION,
  type Bodega,
  type CuerpoBodega,
} from "@/app/modules/bodega/bodegasApi";
import { interpretarErrorHttp } from "@/app/http/errores";
import styles from "@/app/modules/materiales/material-formulario.module.css";

interface Errores {
  [campo: string]: string;
}

export function BodegaFormulario({
  bodega,
  alGuardar,
  alCerrar,
}: {
  bodega?: Bodega | null;
  alGuardar: (resultado: Bodega) => void;
  alCerrar: () => void;
}) {
  const esEdicion = Boolean(bodega);

  const [nombre, setNombre] = useState(bodega?.nombre ?? "");
  const [direccion, setDireccion] = useState(bodega?.direccion ?? "");
  const [telefono, setTelefono] = useState(bodega?.telefono ?? "");
  const [email, setEmail] = useState(bodega?.email ?? "");
  const [nit, setNit] = useState(bodega?.nit ?? "");
  const [latitud, setLatitud] = useState(bodega?.latitud != null ? String(bodega.latitud) : "");
  const [longitud, setLongitud] = useState(bodega?.longitud != null ? String(bodega.longitud) : "");
  const [tipoOrganizacion, setTipoOrganizacion] = useState(bodega?.tipoOrganizacion ?? "");

  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function validar(): boolean {
    const nuevos: Errores = {};
    if (nombre.trim().length < 3) nuevos.nombre = "El nombre debe tener al menos 3 caracteres.";
    if (!direccion.trim()) nuevos.direccion = "La dirección es obligatoria.";
    if (telefono && !/^\d+$/.test(telefono)) nuevos.telefono = "El teléfono solo puede contener números.";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nuevos.email = "Ingresa un correo con formato válido.";
    }
    if (!tipoOrganizacion) nuevos.tipoOrganizacion = "Selecciona el tipo de organización.";
    if (latitud && Number.isNaN(parseFloat(latitud))) nuevos.latitud = "Latitud inválida.";
    if (longitud && Number.isNaN(parseFloat(longitud))) nuevos.longitud = "Longitud inválida.";
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  }

  async function manejarEnvio(evento: React.FormEvent) {
    evento.preventDefault();
    setErrorGeneral(null);
    if (!validar()) return;

    const cuerpo: CuerpoBodega = {
      nombre: nombre.trim(),
      direccion: direccion.trim(),
      telefono: telefono.trim(),
      email: email.trim(),
      nit: nit.trim(),
      latitud: latitud === "" ? null : parseFloat(latitud),
      longitud: longitud === "" ? null : parseFloat(longitud),
      tipoOrganizacion,
    };

    setEnviando(true);
    try {
      const resultado = esEdicion
        ? await actualizarBodega(bodega!.id, cuerpo)
        : await crearBodega(cuerpo);
      alGuardar(resultado);
    } catch (error) {
      setErrorGeneral(interpretarErrorHttp(error, {
        404: "La bodega no existe o fue eliminada.",
      }, "Ocurrió un error al guardar la bodega. Intenta de nuevo."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className={styles.formulario} onSubmit={manejarEnvio}>
      {errorGeneral && <div className={styles.alertaError}>{errorGeneral}</div>}

      <div className={styles.campo}>
        <Label htmlFor="nombre">Nombre *</Label>
        <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Bodega Central" />
        {errores.nombre && <span className={styles.errorCampo}>{errores.nombre}</span>}
      </div>

      <div className={styles.campo}>
        <Label htmlFor="direccion">Dirección *</Label>
        <Input id="direccion" value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Cra 10 # 20-30" />
        {errores.direccion && <span className={styles.errorCampo}>{errores.direccion}</span>}
      </div>

      <div className={styles.fila}>
        <div className={styles.campo}>
          <Label htmlFor="telefono">Teléfono</Label>
          <Input id="telefono" inputMode="numeric" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="3001234567" />
          {errores.telefono && <span className={styles.errorCampo}>{errores.telefono}</span>}
        </div>
        <div className={styles.campo}>
          <Label htmlFor="nit">NIT</Label>
          <Input id="nit" value={nit} onChange={(e) => setNit(e.target.value)} placeholder="900123456-7" />
        </div>
      </div>

      <div className={styles.campo}>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="central@sicofark.com" />
        {errores.email && <span className={styles.errorCampo}>{errores.email}</span>}
      </div>

      <div className={styles.fila}>
        <div className={styles.campo}>
          <Label>Tipo de organización *</Label>
          <Select value={tipoOrganizacion} onValueChange={setTipoOrganizacion}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona tipo" />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_ORGANIZACION.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errores.tipoOrganizacion && <span className={styles.errorCampo}>{errores.tipoOrganizacion}</span>}
        </div>
      </div>

      <div className={styles.fila}>
        <div className={styles.campo}>
          <Label htmlFor="latitud">Latitud</Label>
          <Input id="latitud" type="number" step="0.00001" value={latitud} onChange={(e) => setLatitud(e.target.value)} placeholder="4.60971" />
          {errores.latitud && <span className={styles.errorCampo}>{errores.latitud}</span>}
        </div>
        <div className={styles.campo}>
          <Label htmlFor="longitud">Longitud</Label>
          <Input id="longitud" type="number" step="0.00001" value={longitud} onChange={(e) => setLongitud(e.target.value)} placeholder="-74.08175" />
          {errores.longitud && <span className={styles.errorCampo}>{errores.longitud}</span>}
        </div>
      </div>

      <div className={styles.acciones}>
        <Button type="button" variant="outline" onClick={alCerrar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={enviando}>
          {enviando ? "Guardando..." : esEdicion ? "Guardar cambios" : "Crear bodega"}
        </Button>
      </div>
    </form>
  );
}
