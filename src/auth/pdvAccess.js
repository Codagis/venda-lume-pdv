const PDV_ROLES = new Set(['CASHIER', 'OPERATOR'])

const PDV_PERMISSIONS = new Set([
  'PERMISSION_SALE_CREATE',
  'PERMISSION_POS_ACCESS',
  'PERMISSION_FULL_SYSTEM_ACCESS',
])

const SALES_MODULE_CODE = 'SALES'

/** Verificação síncrona com dados do login ou /auth/me. */
export function userCanAccessPdvSync(user) {
  if (!user) return false
  if (user.isRoot === true) return true
  if (user.role && PDV_ROLES.has(user.role)) return true
  const authorities = user.authorities
  if (!authorities) return false
  const list = Array.isArray(authorities) ? authorities : [...authorities]
  return list.some((a) => PDV_PERMISSIONS.has(a))
}

export function userHasSalesModule(modules) {
  return Array.isArray(modules) && modules.some((m) => m?.code === SALES_MODULE_CODE)
}
