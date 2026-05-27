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

export type CreateCommentPayload = {
  issue: string;
  content: string;
};

export type UpdateCommentPayload = {
  content: string;
};

export type Comment = {
  _id: string;
  issue:
    | string
    | {
        _id?: string;
      };
  author:
    | string
    | {
        _id?: string;
        name?: string;
        email?: string;
        role?: string;
      };
  content: string;
  createdAt?: string;
  updatedAt?: string;
};

function extractComments(data: unknown): Comment[] {
  if (Array.isArray(data)) return data as Comment[];

  if (data && typeof data === "object") {
    const response = data as {
      comments?: unknown;
      data?: unknown;
      comment?: unknown;
    };

    if (Array.isArray(response.comments)) return response.comments as Comment[];
    if (Array.isArray(response.data)) return response.data as Comment[];
    if (Array.isArray(response.comment)) return response.comment as Comment[];
  }

  return [];
}

function extractComment(data: unknown): Comment {
  if (data && typeof data === "object") {
    const response = data as {
      comment?: unknown;
      data?: unknown;
    };

    if (response.comment && typeof response.comment === "object") {
      return response.comment as Comment;
    }

    if (response.data && typeof response.data === "object") {
      return response.data as Comment;
    }
  }

  return data as Comment;
}

export async function createComment(
  payload: CreateCommentPayload
): Promise<Comment> {
  const author = getStoredUserId();

  if (!author) {
    throw new Error("Unable to find logged-in user.");
  }

  const res = await fetch(apiUrl("/api/comments"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      issue: payload.issue,
      author,
      content: payload.content,
    }),
  });

  const data = await readJsonResponse(res);

  if (!res.ok) {
    throw new Error(
      getResponseMessage(data, res.statusText ?? "Failed to add comment")
    );
  }

  return data as Comment;
}

export async function getComments(issueId: string): Promise<Comment[]> {
  const res = await fetch(apiUrl(`/api/comments/post/${issueId}`), {
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
      getResponseMessage(data, res.statusText ?? "Failed to fetch comments")
    );
  }

  return extractComments(data);
}

export async function updateComment(
  commentId: string,
  payload: UpdateCommentPayload
): Promise<Comment> {
  const res = await fetch(apiUrl(`/api/updatecomments/${commentId}`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      content: payload.content,
    }),
  });

  const data = await readJsonResponse(res);

  if (!res.ok) {
    throw new Error(
      getResponseMessage(data, res.statusText ?? "Failed to update comment")
    );
  }

  return extractComment(data);
}

export async function deleteComment(commentId: string): Promise<Comment> {
  const res = await fetch(apiUrl(`/api/deletecomments/${commentId}`), {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });

  const data = await readJsonResponse(res);

  if (!res.ok) {
    throw new Error(
      getResponseMessage(data, res.statusText ?? "Failed to delete comment")
    );
  }

  return extractComment(data);
}
