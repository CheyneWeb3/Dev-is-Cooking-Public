import { useEffect, useMemo, useState } from 'react'
import { Box, Button, Divider, Stack, Typography } from '@mui/material'
import { accountApi } from '../api/client.js'
import { Section } from '../components/Section.jsx'
import { StatusAlert } from '../components/StatusAlert.jsx'

function formatBaseUnits(amountBaseUnits, decimals = 0) {
  const value = BigInt(amountBaseUnits || '0')
  const divisor = 10n ** BigInt(decimals || 0)
  const whole = value / divisor
  const fraction = value % divisor
  if (!decimals) return whole.toString()
  const fractionStr = fraction.toString().padStart(decimals, '0').replace(/0+$/, '')
  return fractionStr ? `${whole.toString()}.${fractionStr}` : whole.toString()
}

function shortAddress(address = '') {
  if (!address) return 'Unknown'
  if (address.length <= 14) return address
  return `${address.slice(0, 6)}...${address.slice(-6)}`
}

function getDepositSourceWallet(d = {}) {
  return d.sourceWallet || d.walletAddress || d.evmFrom || d.fromWallet || d.solanaWallet || d.solanaSourceWallet || ''
}

function aggregateDeposits(deposits = []) {
  const map = new Map()
  for (const d of deposits) {
    const token = d.tokenMintOrContract || d.evmTokenContract || d.mint || 'unknown'
    const fromWallet = getDepositSourceWallet(d)
    const key = [d.chain || 'unknown', d.network || '', token, String(fromWallet).toLowerCase(), d.decimals || 0].join(':')
    const row = map.get(key) || {
      chain: d.chain || 'unknown',
      network: d.network || '',
      token,
      fromWallet,
      symbol: d.tokenSymbol || '',
      decimals: Number(d.decimals || 0),
      confirmedBaseUnits: 0n,
      pendingBaseUnits: 0n,
      confirmedCount: 0,
      pendingCount: 0,
      failedCount: 0
    }
    const amount = BigInt(d.amountBaseUnits || '0')
    if (d.status === 'confirmed' || d.status === 'credited') {
      row.confirmedBaseUnits += amount
      row.confirmedCount += 1
    } else if (d.status === 'submitted' && d.signatureOrTxHash) {
      row.pendingBaseUnits += amount
      row.pendingCount += 1
    } else if (['failed', 'rejected'].includes(d.status)) {
      row.failedCount += 1
    }
    map.set(key, row)
  }
  return Array.from(map.values()).map((r) => ({
    ...r,
    confirmedAmountUi: formatBaseUnits(r.confirmedBaseUnits.toString(), r.decimals),
    pendingAmountUi: formatBaseUnits(r.pendingBaseUnits.toString(), r.decimals)
  }))
}

function MiniStat({ label, value, tone = 'neutral' }) {
  return (
    <Box className={`mini-stat ${tone}`}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography fontWeight={900}>{value}</Typography>
    </Box>
  )
}

function DepositRow({ row }) {
  return (
    <Box className="deposit-row-card">
      <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="flex-start">
        <Box sx={{ minWidth: 0 }}>
          <Typography fontWeight={900}>{row.symbol || 'Token'} · {row.chain}{row.network ? `/${row.network.replace('solana-', '')}` : ''}</Typography>
          <Typography variant="caption" color="text.secondary">{shortAddress(row.fromWallet)}</Typography>
        </Box>
        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
          <Typography fontWeight={900}>{row.confirmedAmountUi}</Typography>
          <Typography variant="caption" color="text.secondary">confirmed</Typography>
        </Box>
      </Stack>
      <Stack direction="row" spacing={1} sx={{ mt: 0.75 }}>
        <Typography variant="caption" color="text.secondary">Pending {row.pendingAmountUi}</Typography>
        <Typography variant="caption" color="text.secondary">Txs {row.confirmedCount}</Typography>
        {row.failedCount ? <Typography variant="caption" color="error.main">Failed {row.failedCount}</Typography> : null}
      </Stack>
    </Box>
  )
}

export function StatusPage({ refreshKey }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    setBusy(true)
    setError('')
    try {
      const [res, depositsRes] = await Promise.all([accountApi.claimStatus(), accountApi.deposits().catch(() => null)])
      const userDeposits = depositsRes?.deposits || depositsRes?.items || depositsRes || res?.deposits || []
      setData({ ...res, deposits: Array.isArray(userDeposits) ? userDeposits : [] })
    } catch (err) {
      setData(null)
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => { load() }, [refreshKey])

  const user = data?.user
  const deposits = data?.deposits || []
  const rows = useMemo(() => aggregateDeposits(deposits), [deposits])
  const confirmed = data?.confirmedDepositCount ?? deposits.filter((d) => d.status === 'confirmed' || d.status === 'credited').length
  const pending = data?.pendingDepositCount ?? deposits.filter((d) => d.status === 'submitted' && d.signatureOrTxHash).length
  const failed = data?.failedDepositCount ?? deposits.filter((d) => d.status === 'failed' || d.status === 'rejected').length
  const telegramOk = Boolean(data?.telegramVerified || user?.telegram?.verified)
  const walletLinked = Boolean(data?.walletLinked)
  const claimSet = Boolean(data?.evmClaimAddressSet || user?.claimAddresses?.evm)

  return (
    <Section title="Status" subtitle="Your registration and deposited token totals.">
      <StatusAlert error={error} />

      <Box className="status-summary-grid">
        <MiniStat label="Telegram" value={telegramOk ? 'verified' : 'needed'} tone={telegramOk ? 'ok' : 'warn'} />
        <MiniStat label="Wallet" value={walletLinked ? 'linked' : 'needed'} tone={walletLinked ? 'ok' : 'warn'} />
        <MiniStat label="Claim" value={claimSet ? 'set' : 'needed'} tone={claimSet ? 'ok' : 'warn'} />
      </Box>

      <Typography variant="body2" color="text.secondary">
        {data?.reason || (error ? 'Open from Telegram first.' : 'Status loaded.')}
      </Typography>
      {user?.claimAddresses?.evm ? <Typography variant="caption" className="break-text">Claim: {user.claimAddresses.evm}</Typography> : null}

      <Divider />

      <Box className="status-summary-grid compact">
        <MiniStat label="Confirmed" value={String(confirmed)} />
        <MiniStat label="Pending" value={String(pending)} />
        <MiniStat label="Failed" value={String(failed)} />
      </Box>

      <Typography variant="subtitle1" fontWeight={900}>Deposits</Typography>
      {rows.length === 0 ? (
        <Typography color="text.secondary">No deposits recorded for this Telegram account yet.</Typography>
      ) : (
        <Stack spacing={0.8}>{rows.map((row) => <DepositRow key={`${row.chain}:${row.token}:${row.fromWallet || 'unknown'}`} row={row} />)}</Stack>
      )}

      <Button variant="outlined" onClick={load} disabled={busy}>{busy ? 'Refreshing...' : 'Refresh status'}</Button>
    </Section>
  )
}
