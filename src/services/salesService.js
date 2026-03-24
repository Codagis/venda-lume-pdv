import { apiFetch } from './api'

export const SALE_TYPE_OPTIONS = [
  { value: 'PDV', label: 'PDV' },
  { value: 'DELIVERY', label: 'Entrega' },
  { value: 'TAKEAWAY', label: 'Retirada' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'WHOLESALE', label: 'Atacado' },
  { value: 'CATERING', label: 'Eventos' },
]

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'CASH', label: 'Dinheiro' },
  { value: 'PIX', label: 'PIX' },
  { value: 'CREDIT_CARD', label: 'Cartão de crédito' },
  { value: 'DEBIT_CARD', label: 'Cartão de débito' },
  { value: 'BANK_TRANSFER', label: 'Transferência' },
  { value: 'MEAL_VOUCHER', label: 'Vale refeição' },
  { value: 'FOOD_VOUCHER', label: 'Vale alimentação' },
  { value: 'CHECK', label: 'Cheque' },
]

export const PAYMENT_METHOD_OPTIONS_PDV = PAYMENT_METHOD_OPTIONS.filter(
  (o) => o.value !== 'CREDIT' && o.value !== 'OTHER'
)

export async function createSale(data) {
  const res = await apiFetch('/sales', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = err?.message || err?.error || 'Erro ao registrar venda.'
    throw new Error(typeof msg === 'string' ? msg : 'Erro ao registrar venda.')
  }
  return res.json()
}

export async function downloadFiscalReceiptPdf(saleId, saleNumber = '') {
  const res = await apiFetch(`/sales/${saleId}/fiscal-receipt.pdf`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.message || err?.error || 'Erro ao gerar cupom fiscal.')
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cupom-fiscal-nfce-${saleNumber || saleId}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function downloadSimpleReceiptPdf(saleId, saleNumber = '') {
  const res = await apiFetch(`/sales/${saleId}/simple-receipt.pdf`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.message || 'Erro ao gerar comprovante.')
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `comprovante-venda-${saleNumber || saleId}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function downloadNfePdf(saleId, saleNumber = '') {
  const res = await apiFetch(`/sales/${saleId}/nfe.pdf`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.message || err?.error || 'Erro ao gerar NF-e.')
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `nfe-${saleNumber || saleId}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
