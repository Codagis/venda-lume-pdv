import { apiFetch } from './api'

export async function createDelivery(data) {
  const res = await apiFetch('/deliveries', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.message || err?.error || 'Erro ao criar entrega.')
  }
  return res.json()
}
