import { PublicKey } from '@solana/web3.js'

export function normalizeSolanaAddress(input = {}) {
  const rawCaip = input?.caipAddress || ''
  const fromCaip = rawCaip.startsWith('solana:') ? rawCaip.split(':').pop() : ''
  const candidate = fromCaip || input?.address || ''

  if (!candidate) return null

  try {
    return new PublicKey(String(candidate).trim()).toBase58()
  } catch {
    return null
  }
}
