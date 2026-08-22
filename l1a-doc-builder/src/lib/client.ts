'use client';

export async function api<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as any).error ?? `Error ${res.status}`);
  return json as T;
}

export const post = <T = any>(url: string, body: unknown) => api<T>(url, { method: 'POST', body: JSON.stringify(body) });
export const put = <T = any>(url: string, body: unknown) => api<T>(url, { method: 'PUT', body: JSON.stringify(body) });
export const patch = <T = any>(url: string, body: unknown) => api<T>(url, { method: 'PATCH', body: JSON.stringify(body) });
