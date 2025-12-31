import { getAccessToken, clearTokens } from "@/lib/session";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

function formatDrfError(data: any, status: number) {
  if (!data) return `HTTP ${status}`;
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  if (data.message) return data.message;
  if (typeof data === "object") {
    const parts: string[] = [];
    for (const [k, v] of Object.entries(data)) {
      if (Array.isArray(v)) parts.push(`${k}: ${v.join(" ")}`);
      else if (typeof v === "string") parts.push(`${k}: ${v}`);
    }
    if (parts.length) return parts.join(" · ");
  }
  return `HTTP ${status}`;
}

export async function apiFetch<T = any>(
  path: string,
  opts: { method?: string; body?: any; auth?: boolean } = {}
): Promise<T> {
  const method = opts.method ?? "GET";
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (opts.auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) clearTokens();

  if (!res.ok) {
    throw new Error(formatDrfError(data, res.status));
  }
  return data as T;
}
