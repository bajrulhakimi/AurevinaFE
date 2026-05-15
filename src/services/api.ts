import axios from "axios";

interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success?: boolean;
}

interface ApiErrorPayload {
  message?: string;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1").replace(/\/$/, "");
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1$/, "");

export function resolveAssetUrl(src?: string | null) {
  if (!src) return "";
  if (src.startsWith("http") || src.startsWith("blob:") || src.startsWith("data:")) return src;
  if (src.startsWith("/storage")) return `${API_ORIGIN}${src}`;
  if (src.startsWith("storage/")) return `${API_ORIGIN}/${src}`;

  return src;
}

const API = axios.create({
  baseURL: API_BASE_URL,
});

// auto inject token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    return error.response?.data?.message || error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}

export function getApiStatus(error: unknown) {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

export function extractApiList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const response = payload as { data?: unknown };

  if (Array.isArray(response.data)) {
    return response.data as T[];
  }

  if (response.data && typeof response.data === "object") {
    const nested = response.data as { data?: unknown };
    if (Array.isArray(nested.data)) {
      return nested.data as T[];
    }
  }

  return [];
}

export default API;
export type { ApiResponse };
