import { apiFetch } from './api'

export async function listActiveByTenant(tenantId) {
  const res = await apiFetch(`/tenants/${tenantId}/card-machines/active`)
  if (!res.ok) throw new Error('Erro ao listar maquininhas.')
  return res.json()
}

export async function listCurrentActive() {
  const res = await apiFetch('/tenants/current/card-machines/active')
  if (!res.ok) throw new Error('Erro ao listar maquininhas.')
  return res.json()
}
