import type { Model, Release, Comment, PagedResponse, SearchResult, User, APIKey } from './types'

/** Internal URL (server-side) vs public URL (client-side / nginx) */
function getBaseURL(): string {
  if (typeof window === 'undefined') {
    return process.env.BACKEND_URL || 'http://backend:8080'
  }
  return ''
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getBaseURL()
  const res = await fetch(`${base}/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  return res.json()
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function register(username: string, email: string, password: string) {
  return apiFetch<{ token: string; user: User }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  })
}

export async function login(email: string, password: string) {
  return apiFetch<{ token: string; user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

// ─── Models ───────────────────────────────────────────────────────────────────

export async function listModels(params?: {
  page?: number
  limit?: number
  architecture?: string
  license?: string
  framework?: string
}) {
  const q = new URLSearchParams()
  if (params?.page) q.set('page', String(params.page))
  if (params?.limit) q.set('limit', String(params.limit))
  if (params?.architecture) q.set('architecture', params.architecture)
  if (params?.license) q.set('license', params.license)
  if (params?.framework) q.set('framework', params.framework)
  return apiFetch<PagedResponse<Model>>(`/models?${q}`)
}

export async function getModel(slug: string) {
  return apiFetch<Model>(`/models/${slug}`)
}

export async function createModel(token: string, data: Partial<Model>) {
  return apiFetch<Model>('/models', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: authHeader(token),
  })
}

export async function updateModel(token: string, slug: string, data: Partial<Model>) {
  return apiFetch<Model>(`/models/${slug}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: authHeader(token),
  })
}

// ─── Releases ─────────────────────────────────────────────────────────────────

export async function listReleases(slug: string) {
  return apiFetch<Release[]>(`/models/${slug}/releases`)
}

export async function getRelease(slug: string, version: string) {
  return apiFetch<Release>(`/models/${slug}/releases/${version}`)
}

export async function getMagnet(slug: string, version: string) {
  return apiFetch<{ magnet: string }>(`/models/${slug}/releases/${version}/magnet`)
}

export async function createRelease(token: string, slug: string, formData: FormData) {
  const base = getBaseURL()
  const res = await fetch(`${base}/api/models/${slug}/releases`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  return res.json() as Promise<Release>
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function search(q: string, page = 1, limit = 20, filter = '') {
  const params = new URLSearchParams({ q, page: String(page), limit: String(limit) })
  if (filter) params.set('filter', filter)
  return apiFetch<SearchResult>(`/search?${params}`)
}

export async function latestModels(limit = 12) {
  return apiFetch<Model[]>(`/latest?limit=${limit}`)
}

export async function popularModels(limit = 12) {
  return apiFetch<Model[]>(`/popular?limit=${limit}`)
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function listComments(slug: string, page = 1) {
  return apiFetch<PagedResponse<Comment>>(`/models/${slug}/comments?page=${page}`)
}

export async function createComment(token: string, slug: string, content: string) {
  return apiFetch<Comment>(`/models/${slug}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
    headers: authHeader(token),
  })
}

// ─── User ─────────────────────────────────────────────────────────────────────

export async function getMe(token: string) {
  return apiFetch<User>('/me', { headers: authHeader(token) })
}

export async function listAPIKeys(token: string) {
  return apiFetch<APIKey[]>('/me/api-keys', { headers: authHeader(token) })
}

export async function createAPIKey(token: string, name: string) {
  return apiFetch<{ key: string } & APIKey>('/me/api-keys', {
    method: 'POST',
    body: JSON.stringify({ name }),
    headers: authHeader(token),
  })
}

export async function deleteAPIKey(token: string, id: string) {
  const base = getBaseURL()
  await fetch(`${base}/api/me/api-keys/${id}`, {
    method: 'DELETE',
    headers: authHeader(token),
  })
}
