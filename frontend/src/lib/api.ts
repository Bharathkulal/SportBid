export interface User {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  role: "PLAYER" | "ORGANIZER" | "SUPER_ADMIN";
  account_status: "ACTIVE" | "PENDING_VERIFICATION" | "SUSPENDED";
  created_at: string;
  last_login_at?: string | null;
}

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, "");

export function getFullStorageUrl(path?: string | null): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${BACKEND_BASE_URL}${cleanPath}`;
}

export function getWebSocketUrl(path: string): string {
  const wsBase = API_BASE_URL.replace(/^http/, "ws");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${wsBase}${cleanPath}`;
}

interface RequestOptions extends RequestInit {
  data?: any;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { data, headers, ...customConfig } = options;

  const config: RequestInit = {
    method: data ? "POST" : "GET",
    credentials: "include", // Critical for HttpOnly session cookie transmission
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    ...customConfig,
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, config);

  if (!response.ok) {
    let errorMessage = "An unexpected error occurred.";
    try {
      const errorJson = await response.json();
      errorMessage =
        errorJson.detail || errorJson.message || JSON.stringify(errorJson);
    } catch {
      errorMessage = `Request failed with status ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}
