function onlyDigits(v) {
  return (v ?? '').toString().replace(/\D/g, '')
}

export function maskPhoneBr(v) {
  const d = onlyDigits(v).slice(0, 11)
  if (!d) return ''
  const ddd = d.slice(0, 2)
  const rest = d.slice(2)
  if (d.length <= 2) return `(${ddd}`
  if (rest.length <= 4) return `(${ddd}) ${rest}`
  if (rest.length <= 8) return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`
}

export function maskCpfCnpjBr(v) {
  const d = onlyDigits(v).slice(0, 14)
  if (!d) return ''
  if (d.length <= 11) {
    // CPF: 000.000.000-00
    const p1 = d.slice(0, 3)
    const p2 = d.slice(3, 6)
    const p3 = d.slice(6, 9)
    const p4 = d.slice(9, 11)
    if (d.length <= 3) return p1
    if (d.length <= 6) return `${p1}.${p2}`
    if (d.length <= 9) return `${p1}.${p2}.${p3}`
    return `${p1}.${p2}.${p3}-${p4}`
  }
  // CNPJ: 00.000.000/0000-00
  const p1 = d.slice(0, 2)
  const p2 = d.slice(2, 5)
  const p3 = d.slice(5, 8)
  const p4 = d.slice(8, 12)
  const p5 = d.slice(12, 14)
  if (d.length <= 2) return p1
  if (d.length <= 5) return `${p1}.${p2}`
  if (d.length <= 8) return `${p1}.${p2}.${p3}`
  if (d.length <= 12) return `${p1}.${p2}.${p3}/${p4}`
  return `${p1}.${p2}.${p3}/${p4}-${p5}`
}

export function normalizeCpfCnpjDigits(v) {
  const d = onlyDigits(v)
  if (d.length === 11 || d.length === 14) return d
  return d || ''
}

