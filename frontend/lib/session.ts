export type Tokens = { access: string; refresh?: string };

const KEY = "mp_tokens_v1";

export function setTokens(tokens: Tokens) {
  localStorage.setItem(KEY, JSON.stringify(tokens));
}

export function getTokens(): Tokens | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Tokens;
  } catch {
    return null;
  }
}

export function clearTokens() {
  localStorage.removeItem(KEY);
}

export function getAccessToken(): string | null {
  return getTokens()?.access ?? null;
}
