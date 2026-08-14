import { clienteApi } from "@/app/http/clienteApi";

export interface RespuestaLogin {
  token: string;
  refreshToken: string | null;
  rol: string;
  nombreCompleto: string;
  username: string;
}

export interface CuerpoLogin {
  username: string;
  password: string;
}

// POST /api/auth/login
export async function login(cuerpo: CuerpoLogin): Promise<RespuestaLogin> {
  const { data } = await clienteApi.post<RespuestaLogin>("/auth/login", cuerpo);
  return data;
}

export function guardarSesion(resp: RespuestaLogin) {
  localStorage.setItem("recyops_token", resp.token);
  localStorage.setItem("recyops_rol", resp.rol);
  localStorage.setItem("recyops_nombre", resp.nombreCompleto);
  localStorage.setItem("recyops_username", resp.username);
  if (resp.refreshToken) {
    localStorage.setItem("recyops_refresh", resp.refreshToken);
  } else {
    localStorage.removeItem("recyops_refresh");
  }
}

export function cerrarSesion() {
  localStorage.removeItem("recyops_token");
  localStorage.removeItem("recyops_rol");
  localStorage.removeItem("recyops_nombre");
  localStorage.removeItem("recyops_username");
  localStorage.removeItem("recyops_refresh");
}

// POST /api/auth/recuperar — envía el correo con el enlace de recuperación.
// Siempre responde OK (no revela si el correo existe).
export async function solicitarRecuperacion(email: string): Promise<void> {
  await clienteApi.post("/auth/recuperar", { email });
}

// POST /api/auth/restablecer — fija la nueva contraseña con el token del correo.
export async function restablecerPassword(accessToken: string, password: string): Promise<void> {
  await clienteApi.post("/auth/restablecer", { accessToken, password });
}
