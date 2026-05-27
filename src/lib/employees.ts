import { apiUrl } from "./api";

function getAuthHeaders() {
  if (typeof window === "undefined") return undefined;
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export type Employee = {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
};

export async function getEmployees(): Promise<Employee[]> {
  const res = await fetch(apiUrl("/api/employees"), {
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to load employees: ${res.statusText}`);
  }

  const data = (await res.json()) as Employee[];
  return data;
}
