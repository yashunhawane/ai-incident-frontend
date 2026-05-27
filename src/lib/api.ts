export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
export const AI_API_BASE_URL = process.env.NEXT_PUBLIC_AI_API_BASE_URL?.replace(/\/$/, "") ?? "";

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

export function aiApiUrl(path: string) {
  return `${AI_API_BASE_URL}${path}`;
}
