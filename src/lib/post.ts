import { apiUrl } from "./api";

function getAuthHeaders() {
  if (typeof window === "undefined") return undefined;
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

function getStoredUserId() {
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

async function readJsonResponse(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function getResponseMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object") {
    const response = data as { message?: string; error?: string };
    return response.message ?? response.error ?? fallback;
  }

  return fallback;
}

function extractUploadedUrl(data: unknown) {
  if (!data || typeof data !== "object") return null;

  const response = data as {
    url?: unknown;
    secure_url?: unknown;
    imageUrl?: unknown;
    fileUrl?: unknown;
    path?: unknown;
    data?: {
      url?: unknown;
      secure_url?: unknown;
      imageUrl?: unknown;
      fileUrl?: unknown;
      path?: unknown;
    };
  };

  if (typeof response.url === "string") return response.url;
  if (typeof response.secure_url === "string") return response.secure_url;
  if (typeof response.imageUrl === "string") return response.imageUrl;
  if (typeof response.fileUrl === "string") return response.fileUrl;
  if (typeof response.path === "string") return response.path;
  if (typeof response.data?.url === "string") return response.data.url;
  if (typeof response.data?.secure_url === "string") {
    return response.data.secure_url;
  }
  if (typeof response.data?.imageUrl === "string") return response.data.imageUrl;
  if (typeof response.data?.fileUrl === "string") return response.data.fileUrl;
  if (typeof response.data?.path === "string") return response.data.path;

  return null;
}

export type CreatePostPayload = {
  project: string;
  reportedBy?: string;
  description: string;
  screenshots?: string[];
  aiSummary?: string | null;
  aiSummaryGeneratedAt?: string | null;
  status?: "open" | "in_progress" | "resolved";
};

export type Post = Omit<CreatePostPayload, "reportedBy"> & {
  _id: string;
  title?: string;
  createdBy?: {
    _id?: string;
    name?: string;
  };
  reportedBy?:
    | string
    | {
        _id?: string;
        name?: string;
      };
  createdAt?: string;
  updatedAt?: string;
};

function extractPosts(data: unknown): Post[] {
  if (Array.isArray(data)) return data as Post[];

  if (data && typeof data === "object") {
    const response = data as {
      posts?: unknown;
      data?: unknown;
      post?: unknown;
    };

    if (Array.isArray(response.posts)) return response.posts as Post[];
    if (Array.isArray(response.data)) return response.data as Post[];
    if (Array.isArray(response.post)) return response.post as Post[];
  }

  return [];
}

export async function uploadPostImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(apiUrl("/api/upload"), {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
    },
    body: formData,
  });

  const data = await readJsonResponse(res);

  if (!res.ok) {
    throw new Error(
      getResponseMessage(data, res.statusText ?? "Failed to upload image")
    );
  }

  const url = extractUploadedUrl(data);
  if (!url) {
    throw new Error("Upload succeeded, but no image URL was returned.");
  }

  return url;
}

export async function createPost(payload: CreatePostPayload): Promise<Post> {
  const reportedBy = payload.reportedBy ?? getStoredUserId();

  const res = await fetch(apiUrl("/api/posts"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      ...payload,
      reportedBy,
      screenshots: payload.screenshots ?? [],
      status: payload.status ?? "open",
    }),
  });

  const data = await readJsonResponse(res);

  if (!res.ok) {
    throw new Error(
      getResponseMessage(data, res.statusText ?? "Failed to create post")
    );
  }

  return data as Post;
}

export async function getPosts(projectId: string): Promise<Post[]> {
  const res = await fetch(apiUrl(`/api/posts/${projectId}`), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });

  const data = await readJsonResponse(res);

  if (res.status === 404) {
    return [];
  }

  if (!res.ok) {
    throw new Error(
      getResponseMessage(data, res.statusText ?? "Failed to fetch posts")
    );
  }

  return extractPosts(data);
}

export async function getPost(
  projectId: string,
  postId: string
): Promise<Post | null> {
  const posts = await getPosts(projectId);
  return posts.find((post) => post._id === postId) ?? null;
}
