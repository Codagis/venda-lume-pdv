import { apiFetch } from './api'

export async function listTenants() {
  const res = await apiFetch('/tenants')
  if (!res.ok) throw new Error('Erro ao listar empresas.')
  return res.json()
}

export async function getCurrentTenant() {
  const res = await apiFetch('/tenants/current')
  if (!res.ok) throw new Error('Empresa não encontrada.')
  return res.json()
}
