import {
  AUTH_CLIENT,
  AUTH_CLIENT_HEADER,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from '../auth/authStorage'
import { notifySessionExpired } from '../auth/authSession'

const API_BASE = process.env.REACT_APP_API_URL || '/api'

/** Sessão isolada do PDV: tokens em localStorage, sem cookies compartilhados com o gestão. */
const defaultOptions = {
  credentials: 'omit',
  headers: { 'Content-Type': 'application/json' },
}

function pickToken(data, snakeKey, camelKey) {
  return data?.[snakeKey] ?? data?.[camelKey] ?? null
}

function buildHeaders(extra = {}) {
  const headers = {
    ...defaultOptions.headers,
    [AUTH_CLIENT_HEADER]: AUTH_CLIENT,
    ...extra,
  }
  const access = getAccessToken()
  if (access) {
    headers.Authorization = `Bearer ${access}`
  }
  return headers
}

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    ...defaultOptions,
    headers: buildHeaders(),
    body: JSON.stringify({ username, password, client: 'pdv' }),
  })

  if (!res.ok) {
    if (res.status === 401 || res.status === 400 || res.status === 403) {
      throw new Error('Usuário ou senha inválidos.')
    }
    const err = await res.json().catch(() => ({}))
    const msg = err?.message || err?.error || 'Usuário ou senha inválidos.'
    throw new Error(typeof msg === 'string' ? msg : 'Usuário ou senha inválidos.')
  }

  const data = await res.json()
  const access = pickToken(data, 'access_token', 'accessToken')
  const refresh = pickToken(data, 'refresh_token', 'refreshToken')
  if (!access) {
    throw new Error('Resposta de login inválida. Tente novamente.')
  }
  setTokens(access, refresh)
  return data
}

export async function refreshToken() {
  const refresh = getRefreshToken()
  if (!refresh) {
    throw new Error('Sessão expirada. Faça login novamente.')
  }

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    ...defaultOptions,
    headers: buildHeaders(),
    body: JSON.stringify({ refreshToken: refresh }),
  })

  if (!res.ok) {
    clearTokens()
    throw new Error('Sessão expirada. Faça login novamente.')
  }

  const data = await res.json()
  const access = pickToken(data, 'access_token', 'accessToken')
  const nextRefresh = pickToken(data, 'refresh_token', 'refreshToken') || refresh
  if (access) {
    setTokens(access, nextRefresh)
  }
  return data
}

export async function fetchMe() {
  if (!getAccessToken()) {
    return null
  }
  const res = await fetch(`${API_BASE}/auth/me`, {
    method: 'GET',
    credentials: 'omit',
    headers: buildHeaders(),
  })
  if (res.status === 401) return null
  if (!res.ok) return null
  return res.json()
}

export async function logoutApi() {
  clearTokens()
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'omit',
      headers: buildHeaders(),
    })
  } catch (_) {
    /* offline */
  }
}

function clearAuthAndRedirect() {
  clearTokens()
  notifySessionExpired()
}

async function handleUnauthorized(res, path, opts) {
  if (res.status !== 401) return res
  try {
    await refreshToken()
    const retryHeaders = buildHeaders(opts?.headers)
    if (opts?.body instanceof FormData) {
      delete retryHeaders['Content-Type']
      delete retryHeaders['content-type']
    }
    const retry = await fetch(`${API_BASE}${path}`, {
      ...opts,
      credentials: 'omit',
      headers: retryHeaders,
    })
    if (retry.status === 401) clearAuthAndRedirect()
    return retry
  } catch {
    clearAuthAndRedirect()
  }
  return res
}

export function apiFetch(path, options = {}) {
  const isFormData = options.body instanceof FormData
  const headers = isFormData
    ? buildHeaders(options.headers || {})
    : buildHeaders(options.headers || {})
  if (isFormData) {
    delete headers['Content-Type']
    delete headers['content-type']
  }
  const opts = {
    ...defaultOptions,
    ...options,
    headers,
  }
  const skipAuthRefresh = options?.skipAuthRefresh === true
  return fetch(`${API_BASE}${path}`, opts).then((res) => {
    if (!skipAuthRefresh && res.status === 401) {
      return handleUnauthorized(res, path, opts)
    }
    return res
  })
}
