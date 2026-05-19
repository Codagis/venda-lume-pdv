/** Registra service worker em produção para permitir instalação PWA (desktop/atalho). */
function shouldRegisterPwa() {
  if (process.env.NODE_ENV === 'production') return true
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1'
}

export function registerPwa() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
  if (!shouldRegisterPwa()) return

  window.addEventListener('load', () => {
    const swUrl = `${process.env.PUBLIC_URL || ''}/sw.js`
    navigator.serviceWorker.register(swUrl).catch(() => {})
  })
}
