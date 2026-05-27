import { apiUrl } from "./api";

export type Role = "teamlead" | "employee";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

async function postJson<Req, Res>(endpoint: string, payload: Req): Promise<Res> {
  const res = await fetch(apiUrl(endpoint), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let data: Record<string, unknown> | null = null;
  try {
    data = await res.json();
  } catch {
    // ignore JSON parse errors; we'll surface status text if available
  }

  if (!res.ok) {
    const message = (data && ((data['message'] as string) ?? (data['error'] as string))) ?? res.statusText ?? "Request failed";
    throw new Error(message);
  }

  return data as Res;
}

export const registerUser = (payload: RegisterPayload): Promise<AuthResponse> =>
  postJson<RegisterPayload, AuthResponse>("/api/auth/register", payload);

export const loginUser = (payload: LoginPayload): Promise<AuthResponse> =>
  postJson<LoginPayload, AuthResponse>("/api/auth/login", payload);

export { postJson };
