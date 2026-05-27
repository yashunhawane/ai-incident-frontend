import { apiUrl } from "./api";

function getAuthHeaders() {
  if (typeof window === "undefined") return undefined;
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export function getStoredUserId() {
  if (typeof window === "undefined") return null;
  const rawUser = localStorage.getItem("user");
  if (!rawUser) return null;

  try {
    const user = JSON.parse(rawUser) as { id?: string; _id?: string };
    return user.id ?? user._id ?? null;
  } catch {
    return null;
  }
}

export type CreateProjectPayload = {
  title: string;
  description?: string;
  members?: string[];
  status?: "active" | "closed";
};

export type Project = {
  _id: string;
  title: string;
  description: string;
  teamLead: string;
  members: ProjectMember[];
  status: "active" | "closed";
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
};

export type ProjectMember =
  | string
  | {
      _id?: string;
      id?: string;
      name?: string;
      email?: string;
    };

export type ProjectPost = {
  _id: string;
  title: string;
  createdBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
};

export type ProjectDetail = Omit<Project, "teamLead"> & {
  name?: string;
  teamLead: {
    _id: string;
    name: string;
  };
  posts?: ProjectPost[];
};

export async function createProject(payload: CreateProjectPayload): Promise<Project> {
  const teamLead = getStoredUserId();

  if (!teamLead) {
    throw new Error("Unable to find logged-in team lead.");
  }

  const res = await fetch(apiUrl("/api/projects"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      ...payload,
      teamLead,
      description: payload.description ?? "",
      members: payload.members ?? [],
    }),
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // Fall back to status text below if the API returns no JSON body.
  }

  if (!res.ok) {
    const message =
      data && typeof data === "object"
        ? ((data as { message?: string; error?: string }).message ??
          (data as { message?: string; error?: string }).error)
        : undefined;
    throw new Error(message ?? res.statusText ?? "Failed to create project");
  }

  return data as Project;
}

export async function getProject(projectId: string): Promise<ProjectDetail> {
  const res = await fetch(apiUrl(`/api/projects/${projectId}`), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // Fall back to status text below if the API returns no JSON body.
  }

  if (!res.ok) {
    const message =
      data && typeof data === "object"
        ? ((data as { message?: string; error?: string }).message ??
          (data as { message?: string; error?: string }).error)
        : undefined;
    throw new Error(message ?? res.statusText ?? "Failed to fetch project");
  }

  return data as ProjectDetail;
}

export async function getProjects(): Promise<Project[]> {
  const teamLeadId = getStoredUserId();

  if (!teamLeadId) {
    throw new Error("Unable to find logged-in team lead.");
  }

  const res = await fetch(apiUrl(`/api/projects/teamLead/${teamLeadId}`), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // Fall back to status text below if the API returns no JSON body.
  }

  if (!res.ok) {
    const message =
      data && typeof data === "object"
        ? ((data as { message?: string; error?: string }).message ??
          (data as { message?: string; error?: string }).error)
        : undefined;
    throw new Error(message ?? res.statusText ?? "Failed to load projects");
  }

  if (Array.isArray(data)) {
    return data as Project[];
  }

  if (data && typeof data === "object" && Array.isArray((data as { projects?: unknown }).projects)) {
    return (data as { projects: Project[] }).projects;
  }

  return [];
}

export async function getEmployeeProjects(): Promise<Project[]> {
  const employeeId = getStoredUserId();

  if (!employeeId) {
    throw new Error("Unable to find logged-in employee.");
  }

  const res = await fetch(apiUrl(`/api/projects/employee/${employeeId}`), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // Fall back to status text below if the API returns no JSON body.
  }

  if (!res.ok) {
    const message =
      data && typeof data === "object"
        ? ((data as { message?: string; error?: string }).message ??
          (data as { message?: string; error?: string }).error)
        : undefined;
    throw new Error(message ?? res.statusText ?? "Failed to load projects");
  }

  if (Array.isArray(data)) {
    return data as Project[];
  }

  if (data && typeof data === "object" && Array.isArray((data as { projects?: unknown }).projects)) {
    return (data as { projects: Project[] }).projects;
  }

  return [];
}
