import { API_BASE } from '../config/env.js'

export async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options,
    body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body
  })

  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { raw: text }
  }

  if (!res.ok) {
    const message = data?.error || `Request failed: ${res.status}`
    throw new Error(message)
  }

  return data
}

export const authApi = {
  me: () => api('/api/auth/me'),
  logout: () => api('/api/auth/logout', { method: 'POST' })
}

export const telegramApi = {
  consumeOpenAppCode: (code) => api('/api/telegram/open-app/consume', { method: 'POST', body: { code } })
}

export const accountApi = {
  claimStatus: () => api('/api/account/claim-status?claimChain=evm'),
  deposits: () => api('/api/account/deposits'),
  linkWallet: ({ chain, address, setAsClaim = false, primary = false }) => api('/api/account/link-wallet', {
    method: 'POST',
    body: { chain, address, setAsClaim, primary }
  }),
  setClaimAddress: (address) => api('/api/account/claim-address', { method: 'POST', body: { chain: 'evm', address } }),
  lookupWallets: (wallets) => api('/api/account/lookup-wallets', { method: 'POST', body: { wallets } }),
  snapshotAllowance: ({ chain, walletAddress, token, tokenMintOrContract, network }) => api('/api/account/snapshot-allowance', {
    method: 'POST',
    body: { chain, walletAddress, token, tokenMintOrContract, network }
  })
}

export const depositApi = {
  solanaIntent: (body) => api('/api/solana-deposits/intent', { method: 'POST', body }),
  solanaSubmit: (depositId, signature) => api(`/api/solana-deposits/${depositId}/submit`, { method: 'POST', body: { signature } }),
  solanaVoid: (depositId, reason) => api(`/api/solana-deposits/${depositId}/void`, { method: 'POST', body: { reason } }),
  evmIntent: (body) => api('/api/evm-deposits/intent', { method: 'POST', body }),
  evmSubmit: (depositId, txHash) => api(`/api/evm-deposits/${depositId}/submit`, { method: 'POST', body: { txHash } }),
  evmVoid: (depositId, reason) => api(`/api/evm-deposits/${depositId}/void`, { method: 'POST', body: { reason } })
}

export const publicApi = {
  tokenTotals: () => api('/api/public/token-totals'),
  depositTokens: () => api('/api/public/deposit-tokens')
}
