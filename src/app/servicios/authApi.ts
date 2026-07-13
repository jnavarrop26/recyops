import { clienteApi } from "./clienteApi";

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
  localStorage.setItem("sicofar_token", resp.token);
  localStorage.setItem("sicofar_rol", resp.rol);
  localStorage.setItem("sicofar_nombre", resp.nombreCompleto);
  localStorage.setItem("sicofar_username", resp.username);
  if (resp.refreshToken) {
    localStorage.setItem("sicofar_refresh", resp.refreshToken);
  } else {
    localStorage.removeItem("sicofar_refresh");
  }
}

export function cerrarSesion() {
  localStorage.removeItem("sicofar_token");
  localStorage.removeItem("sicofar_rol");
  localStorage.removeItem("sicofar_nombre");
  localStorage.removeItem("sicofar_username");
  localStorage.removeItem("sicofar_refresh");
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
