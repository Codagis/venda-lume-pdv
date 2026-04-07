import { apiFetch } from './api'

export async function listRegisters(tenantId = null, activeOnly = false, forCurrentOperator = false) {
  const params = new URLSearchParams()
  if (tenantId) params.append('tenantId', tenantId)
  if (activeOnly) params.append('activeOnly', 'true')
  if (forCurrentOperator) params.append('forCurrentOperator', 'true')
  const q = params.toString()
  const url = q ? `/registers?${q}` : '/registers'
  const res = await apiFetch(url)
  if (!res.ok) throw new Error('Erro ao listar pontos de venda.')
  return res.json()
}

export async function startSession(registerId, tenantId = null, body = {}) {
  const url = tenantId
    ? `/registers/${registerId}/session/start?tenantId=${encodeURIComponent(tenantId)}`
    : `/registers/${registerId}/session/start`
  // Esta rota pode retornar 401 para "senha do PDV inválida" em algumas instalações.
  // Não devemos tentar refresh token / redirecionar para /login nesse caso — queremos mostrar o erro na tela do PDV.
  const res = await apiFetch(url, { method: 'POST', body: JSON.stringify(body || {}), skipAuthRefresh: true })
  if (!res.ok) {
    if (res.status === 401 || res.status === 400 || res.status === 403) {
      throw new Error('Senha do PDV inválida.')
    }
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.message || err?.error || 'Erro ao iniciar sessão do PDV.')
  }
  return res.json()
}

export async function endSession(registerId, tenantId = null) {
  const url = tenantId
    ? `/registers/${registerId}/session/end?tenantId=${encodeURIComponent(tenantId)}`
    : `/registers/${registerId}/session/end`
  const res = await apiFetch(url, { method: 'POST' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.message || err?.error || 'Erro ao encerrar sessão do PDV.')
  }
  return res.json()
}
