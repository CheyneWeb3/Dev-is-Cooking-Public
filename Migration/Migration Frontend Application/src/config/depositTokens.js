export const FALLBACK_DEPOSIT_TOKENS = {
  solana: {
    chain: 'solana',
    network: 'solana-mainnet',
    name: 'SaveMoon',
    symbol: 'SVM',
    mint: '7NX8vBJ5EBPP6Ke6SB9JF3rrLcgZ2EYv8d8bFNqaBAGS'
  },
  evm: {
    chain: 'evm',
    network: 'bsc',
    chainId: 56,
    name: 'moonboy',
    symbol: 'MOON',
    tokenContract: '0xA0c64F64026fE6C9f44Fd7BE129fbfEf5F9B5639'
  }
}

export function shortAddress(value) {
  if (!value) return ''
  return `${value.slice(0, 8)}...${value.slice(-6)}`
}
