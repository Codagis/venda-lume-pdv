/** Callback registrado pelo AuthProvider quando a sessão JWT expira de fato. */
let onSessionExpired = null

export function setSessionExpiredHandler(handler) {
  onSessionExpired = typeof handler === 'function' ? handler : null
}

export function notifySessionExpired() {
  if (onSessionExpired) {
    onSessionExpired()
    return
  }
  const base = typeof process !== 'undefined' && process.env?.PUBLIC_URL ? process.env.PUBLIC_URL : ''
  window.location.href = `${base}/login`
}
