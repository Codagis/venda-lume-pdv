import { apiFetch } from './api'

export async function getCustomerById(id) {
  const res = await apiFetch(`/customers/${id}`)
  if (!res.ok) throw new Error('Cliente não encontrado.')
  return res.json()
}

export async function searchCustomers(filter = {}) {
  let url = '/customers/search'
  if (filter.tenantId != null && filter.tenantId !== '') {
    url += `?tenantId=${encodeURIComponent(filter.tenantId)}`
  }
  const body = { ...filter }
  delete body.tenantId
  const res = await apiFetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Erro ao buscar clientes.')
  return res.json()
}

export async function createCustomer(data) {
  const res = await apiFetch('/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = err?.message || err?.error || 'Erro ao cadastrar cliente.'
    throw new Error(typeof msg === 'string' ? msg : 'Erro ao cadastrar cliente.')
  }
  return res.json()
}
