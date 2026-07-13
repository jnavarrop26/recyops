import { useState } from "react";
import { useNavigate } from "react-router";
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowLeft } from "lucide-react";
import Logo1Recyops from "./logo-recyops";
import { RecyOPSIcon } from "./recyops-icon";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { login, guardarSesion, solicitarRecuperacion } from "../servicios/authApi";
import styles from "./login-screen.module.css";

export function LoginScreen() {
  const navigate = useNavigate();
  const [fase, setFase] = useState<"splash" | "saliendo" | "formulario">("splash");
  const [showPwd, setShowPwd] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [enviandoRecuperacion, setEnviandoRecuperacion] = useState(false);

  function abrirFormulario() {
    setFase("saliendo");
    setTimeout(() => setFase("formulario"), 560);
  }

  function volverAlSplash() {
    setFase("splash");
    setError(null);
    setUsername("");
    setPassword("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const resp = await login({ username: username.trim(), password });
      guardarSesion(resp);
      navigate("/inicio");
    } catch (err: any) {
      const estado = err?.response?.status;
      if (estado === 401 || estado === 403) {
        setError("Usuario o contraseña incorrectos.");
      } else if (estado === undefined || estado === 0) {
        setError("No se pudo conectar al servidor. Usa el acceso demo.");
      } else {
        setError("Ocurrió un error al iniciar sesión. Intenta de nuevo.");
      }
    } finally {
      setCargando(false);
    }
  }

  async function recuperarPassword() {
    setError(null);
    setInfo(null);
    const correo = username.trim();
    if (!correo || !correo.includes("@")) {
      setError("Escribe tu correo en el campo Usuario y vuelve a intentarlo.");
      return;
    }
    setEnviandoRecuperacion(true);
    try {
      await solicitarRecuperacion(correo);
      setInfo(`Si ${correo} está registrado, te llegará un enlace para restablecer la contraseña.`);
    } catch (err: any) {
      const mensaje = err?.response?.data?.mensaje;
      setError(mensaje ?? "No se pudo enviar el correo de recuperación. Intenta de nuevo.");
    } finally {
      setEnviandoRecuperacion(false);
    }
  }

  const enSplash = fase === "splash" || fase === "saliendo";
  const enForm   = fase === "formulario";

  return (
    <div className={styles.shell}>

      {/* ── FASE 1: Splash ── */}
      {enSplash && (
        <div className={`${styles.splash} ${fase === "saliendo" ? styles.saliendo : ""}`}>
          <div className={styles.logoWrap}>
            <Logo1Recyops />
          </div>

          <span className={styles.tagline}>Sistema de Bodegas de Reciclaje</span>

          <button type="button" className={styles.btnEntrar} onClick={() => setFase("formulario")}>
            <LogIn size={18} />
            Iniciar sesión
          </button>
        </div>
      )}

      {/* ── FASE 2: Formulario ── */}
      <div className={`${styles.formPanel} ${enForm ? styles.visible : ""}`}>

        {/* Encabezado */}
        <div className={styles.formHeader}>
          <div className={styles.formHeaderLogo}>
            <Logo1Recyops />
          </div>
          <div className={styles.formHeaderTexto}>
            <span className={styles.formHeaderNombre}>RecyOPS</span>
            <span className={styles.formHeaderSub}>Bodegas de Reciclaje</span>
          </div>
          <button type="button" className={styles.btnVolver} onClick={volverAlSplash}>
            <ArrowLeft size={14} />
            Volver
          </button>
        </div>

        {/* Formulario centrado */}
        <div className={styles.formBody}>
          <div className={styles.formCard}>
            <div style={{ marginBottom: "28px" }}>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "6px", color: "#0F5132" }}>
                Bienvenido
              </h1>
              <p style={{ fontSize: "0.9rem", color: "#6b8c77" }}>
                Ingresa tus credenciales para acceder al panel.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {error && (
                <div style={{
                  borderRadius: "8px",
                  border: "1px solid #fca5a5",
                  background: "#fef2f2",
                  padding: "12px 16px",
                  fontSize: "0.875rem",
                  color: "#b91c1c",
                }}>
                  {error}
                </div>
              )}
              {info && (
                <div style={{
                  borderRadius: "8px",
                  border: "1px solid #b7dcc4",
                  background: "#f0f9f3",
                  padding: "12px 16px",
                  fontSize: "0.875rem",
                  color: "#0F5132",
                }}>
                  {info}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Label htmlFor="username">Usuario</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="username"
                    required
                    placeholder="admin"
                    className="pl-9"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Label htmlFor="password">Contraseña</Label>
                  <button
                    type="button"
                    onClick={recuperarPassword}
                    disabled={enviandoRecuperacion}
                    style={{
                      fontSize: "0.8rem",
                      color: "#0F5132",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      textDecoration: "underline",
                    }}
                  >
                    {enviandoRecuperacion ? "Enviando correo..." : "¿Olvidaste tu contraseña?"}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    className="pl-9 pr-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox id="remember" defaultChecked />
                <Label htmlFor="remember" className="font-normal text-muted-foreground">
                  Mantener sesión iniciada
                </Label>
              </div>

              <Button type="submit" className="w-full" disabled={cargando}>
                <LogIn className="size-4" />
                {cargando ? "Ingresando..." : "Ingresar"}
              </Button>
            </form>

          </div>
        </div>

        {/* Footer */}
        <div className={styles.formFooter}>
          <span className={styles.footerCopy}>
            <RecyOPSIcon size={14} variant="default" />
            RecyOPS © 2023 — 2026
          </span>
          <nav className={styles.footerLinks}>
            <a href="#" className={styles.footerLink}>Soporte</a>
            <a href="#" className={styles.footerLink}>Privacidad</a>
            <a href="#" className={styles.footerLink}>Términos</a>
          </nav>
        </div>
      </div>

    </div>
  );
}
