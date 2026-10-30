const base = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
let token: string | null = null;
export const setApiToken = (value: string | null) => {
  token = value;
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      ...options,
      headers,
      signal: options.signal ?? AbortSignal.timeout(20000),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      throw error;
    throw new ApiError(
      0,
      "No pudimos conectar con el gimnasio. Verificá la conexión e intentá nuevamente.",
    );
  }
  const raw = await response.text();
  let data: unknown;
  try {
    data = raw ? JSON.parse(raw) : undefined;
  } catch {
    data = undefined;
  }
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith("/auth/"))
      window.dispatchEvent(new Event("gym:unauthorized"));
    const serverMessage =
      data && typeof data === "object" && "message" in data
        ? String(data.message)
        : "";
    const fallback =
      response.status === 403
        ? "No tenés permiso para realizar esta operación."
        : response.status === 401
          ? "El email o la contraseña no son correctos."
          : response.status >= 500
            ? "El servicio no está disponible por el momento. Intentá nuevamente."
            : "No pudimos completar la operación.";
    const translated = serverMessage.startsWith("Email already exists")
      ? "Ya existe una cuenta con ese email."
      : serverMessage === "User does not have an active membership"
        ? "El socio necesita una membresía vigente para registrar su ingreso."
        : serverMessage;
    throw new ApiError(response.status, translated || fallback);
  }
  return data as T;
}
export const save = <T>(path: string, data: unknown, id?: number) =>
  api<T>(id ? `${path}/${id}` : path, {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(data),
  });
