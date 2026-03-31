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

function parseSaleResponseBody(text) {
  if (text == null || !String(text).trim()) {
    return null
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('Resposta inválida do servidor ao registrar a venda.')
  }
}

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
  const text = await res.text()
  const parsed = parseSaleResponseBody(text)
  if (parsed == null) {
    throw new Error('A venda pode ter sido registrada, mas o servidor não devolveu os dados. Atualize a página ou consulte as vendas no sistema principal.')
  }
  // Alguns backends encapsulam o DTO
  if (parsed && typeof parsed === 'object' && parsed.id == null && parsed.data != null) {
    return parsed.data
  }
  if (parsed && typeof parsed === 'object' && parsed.id == null && parsed.sale != null) {
    return parsed.sale
  }
  return parsed
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
