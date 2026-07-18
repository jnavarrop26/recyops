import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Lock, Eye, EyeOff, KeyRound } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { AuthLayout } from "@/app/modules/auth/auth-layout";
import { restablecerPassword } from "@/app/modules/auth/authApi";
import { estadoHttp, mensajeDelServidor } from "@/app/http/errores";

/**
 * Pantalla a la que llega el enlace del correo de recuperación de Supabase:
 * /restablecer#access_token=...&type=recovery
 * Lee el token del fragmento de la URL y fija la nueva contraseña.
 */
export function RestablecerScreen() {
  const navigate = useNavigate();

  // El token viaja en el hash (#access_token=...), nunca llega al servidor
  const accessToken = useMemo(() => {
    const parametros = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    return parametros.get("access_token") ?? "";
  }, []);

  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmacion) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setEnviando(true);
    try {
      await restablecerPassword(accessToken, password);
      setListo(true);
      setTimeout(() => navigate("/"), 2500);
    } catch (err) {
      if (estadoHttp(err) === 401) {
        setError("El enlace ya venció o fue usado. Pide uno nuevo desde el login.");
      } else {
        setError(mensajeDelServidor(err) ?? "No se pudo restablecer la contraseña. Intenta de nuevo.");
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout>
      <div style={{ background: "#fff", border: "1px solid #dbe7de", borderRadius: 16, padding: 32 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 6, color: "#0F5132" }}>
            Nueva contraseña
          </h1>
          <p style={{ fontSize: "0.9rem", color: "#6b8c77" }}>
            Define la contraseña con la que entrarás a RecyOPS.
          </p>
        </div>

        {!accessToken ? (
          <div style={{
            borderRadius: 8, border: "1px solid #fca5a5", background: "#fef2f2",
            padding: "12px 16px", fontSize: "0.875rem", color: "#b91c1c",
          }}>
            Este enlace no es válido. Vuelve al{" "}
            <button type="button" onClick={() => navigate("/")}
              style={{ color: "#0F5132", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
              login
            </button>{" "}
            y usa "¿Olvidaste tu contraseña?" para pedir uno nuevo.
          </div>
        ) : listo ? (
          <div style={{
            borderRadius: 8, border: "1px solid #b7dcc4", background: "#f0f9f3",
            padding: "12px 16px", fontSize: "0.875rem", color: "#0F5132",
          }}>
            Contraseña actualizada. Te llevamos al login...
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {error && (
              <div style={{
                borderRadius: 8, border: "1px solid #fca5a5", background: "#fef2f2",
                padding: "12px 16px", fontSize: "0.875rem", color: "#b91c1c",
              }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Label htmlFor="password">Nueva contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  required
                  placeholder="Mínimo 6 caracteres"
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

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Label htmlFor="confirmacion">Confirmar contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="confirmacion"
                  type={showPwd ? "text" : "password"}
                  required
                  placeholder="Repite la contraseña"
                  className="pl-9"
                  value={confirmacion}
                  onChange={(e) => setConfirmacion(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={enviando}>
              <KeyRound className="size-4" />
              {enviando ? "Guardando..." : "Guardar contraseña"}
            </Button>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}
