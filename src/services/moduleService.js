import { apiFetch } from './api'

export async function listModules() {
  const res = await apiFetch('/modules')
  if (!res.ok) throw new Error('Falha ao carregar módulos.')
  return res.json()
}
