export const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
export const REOWN_PROJECT_ID = import.meta.env.VITE_REOWN_PROJECT_ID || ''
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Migrate Tokens'
export const APP_URL = import.meta.env.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')

function buildTelegramLinkUrl(rawUrl) {
  const value = String(rawUrl || '').trim()
  if (!value) return ''

  try {
    const url = new URL(value.startsWith('@') ? `https://t.me/${value.slice(1)}` : value)
    if (url.hostname === 't.me' || url.hostname === 'telegram.me') {
      url.searchParams.set('start', 'link')
    }
    return url.toString()
  } catch {
    const username = value.replace(/^@/, '').replace(/^https?:\/\/t\.me\//, '').split(/[/?#]/)[0]
    return username ? `https://t.me/${username}?start=link` : ''
  }
}

export const TELEGRAM_BOT_URL = buildTelegramLinkUrl(import.meta.env.VITE_TELEGRAM_BOT_URL || '')
export const BSC_CHAIN_ID = Number(import.meta.env.VITE_BSC_CHAIN_ID || 56)
export const BSC_CHAIN_ID_HEX = `0x${BSC_CHAIN_ID.toString(16)}`

export const SOLANA_DEPOSIT_ADDRESS = import.meta.env.VITE_SOLANA_DEPOSIT_ADDRESS || ''
