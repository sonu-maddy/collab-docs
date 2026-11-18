const BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'collab_docs_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

/** Single fetch wrapper: auth header, JSON in/out, uniform ApiError. */
export async function http(path, { method = 'GET', body, formData } = {}) {
  const headers = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection.');
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // 401 on protected calls means the session is gone; login/register 401s are real errors.
    if (res.status === 401 && token) onUnauthorized();
    throw new ApiError(res.status, data.error || `Request failed (${res.status})`);
  }
  return data;
}
