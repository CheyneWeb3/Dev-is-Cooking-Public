import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Stack,
  Typography
} from '@mui/material'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import TelegramIcon from '@mui/icons-material/Telegram'
import RefreshIcon from '@mui/icons-material/Refresh'
import { useAppKit, useAppKitAccount } from '@reown/appkit/react'
import { isAddress } from 'ethers'
import { accountApi, authApi, telegramApi } from '../api/client.js'
import { TELEGRAM_BOT_URL } from '../config/env.js'
import { Section } from './Section.jsx'
import { normalizeSolanaAddress } from '../wallet/solanaAddress.js'

function short(address) {
  if (!address) return 'not connected'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function sameAddress(a, b) {
  return String(a || '').toLowerCase() === String(b || '').toLowerCase()
}

function hasWallet(status, chain, address) {
  if (!status?.user || !address) return false
  const key = chain === 'evm' ? 'evmWallets' : 'solanaWallets'
  return Boolean((status.user[key] || []).some((w) => sameAddress(w.address, address)))
}

function connectedWallets(evmAddress, solAddress) {
  const wallets = []
  if (evmAddress && isAddress(evmAddress)) wallets.push({ chain: 'evm', address: evmAddress })
  if (solAddress) wallets.push({ chain: 'solana', address: solAddress })
  return wallets
}

function summarizeLookup(matches = []) {
  const linked = matches.filter((m) => m.linked)
  if (linked.length === 0) return ''
  return 'Open from Telegram to restore/check the account session before linking wallets.'
}

function StatusPill({ label, ok, neutral = false }) {
  return (
    <Box
      sx={{
        px: 1.25,
        py: 0.75,
        borderRadius: 999,
        bgcolor: neutral ? 'rgba(148,163,184,0.10)' : ok ? 'rgba(34,197,94,0.16)' : 'rgba(245,158,11,0.16)',
        color: neutral ? 'text.secondary' : ok ? '#86efac' : '#fbbf24',
        border: '1px solid',
        borderColor: neutral ? 'rgba(148,163,184,0.18)' : ok ? 'rgba(34,197,94,0.28)' : 'rgba(245,158,11,0.28)',
        fontSize: 13,
        fontWeight: 800,
        whiteSpace: 'nowrap'
      }}
    >
      {label}
    </Box>
  )
}

function InfoRow({ label, value }) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.5} justifyContent="space-between" sx={{ py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={800} sx={{ wordBreak: 'break-all' }}>{value}</Typography>
    </Stack>
  )
}

export function AccountPanel({ refreshKey = 0, onRefresh, onStatusChange, mode = 'page' }) {
  const { open } = useAppKit()
  const evm = useAppKitAccount({ namespace: 'eip155' })
  const sol = useAppKitAccount({ namespace: 'solana' })
  const solAddress = useMemo(
    () => normalizeSolanaAddress({ address: sol.address, caipAddress: sol.caipAddress }),
    [sol.address, sol.caipAddress]
  )
  const [status, setStatus] = useState(null)
  const [walletLookup, setWalletLookup] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const consumedRef = useRef(false)
  const attemptedRef = useRef(new Set())
  const loadingRef = useRef(false)
  const autoLinkingRef = useRef(false)

  function updateStatus(nextStatus) {
    setStatus(nextStatus)
    onStatusChange?.(nextStatus)
  }

  const anyConnected = Boolean(evm.isConnected || sol.isConnected || evm.address || solAddress)

  const tgCode = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return new URLSearchParams(window.location.search).get('tgCode') || ''
  }, [])

  const lookupConnectedWallets = useCallback(async () => {
    const wallets = connectedWallets(evm.address, solAddress)
    if (wallets.length === 0) {
      setWalletLookup(null)
      return null
    }
    try {
      const res = await accountApi.lookupWallets(wallets)
      setWalletLookup(res)
      return res
    } catch {
      return null
    }
  }, [evm.address, solAddress])

  const loadMe = useCallback(async () => {
    if (loadingRef.current) return status
    loadingRef.current = true
    try {
      const res = await authApi.me()
      const nextStatus = res.status || res
      updateStatus(nextStatus)
      setError('')
      await lookupConnectedWallets()
      return nextStatus
    } catch {
      // Do not clear an already linked account during a temporary cookie/network miss.
      if (!status) updateStatus(null)
      await lookupConnectedWallets()
      return status || null
    } finally {
      loadingRef.current = false
    }
  }, [lookupConnectedWallets, status])

  useEffect(() => {
    async function boot() {
      setBusy(true)
      setError('')
      try {
        if (tgCode && !consumedRef.current) {
          consumedRef.current = true
          const url = new URL(window.location.href)
          url.searchParams.delete('tgCode')
          window.history.replaceState({}, '', url.toString())
          const res = await telegramApi.consumeOpenAppCode(tgCode)
          const nextStatus = res.status || null
          updateStatus(nextStatus)
          setMessage('Telegram session restored.')
          await lookupConnectedWallets()
          return
        }
        await loadMe()
      } catch (err) {
        if (!status) updateStatus(null)
        setError(err.message || 'Telegram link failed. Open the app from Telegram again.')
        await lookupConnectedWallets()
      } finally {
        setBusy(false)
      }
    }

    boot()
  }, [tgCode, refreshKey])

  useEffect(() => {
    async function autoLink() {
      if (!status?.telegramVerified && !status?.user?.telegram?.verified) {
        await lookupConnectedWallets()
        return
      }
      if (busy || autoLinkingRef.current) return

      const jobs = []

      if (evm.address && isAddress(evm.address) && !hasWallet(status, 'evm', evm.address)) {
        const key = `evm:${evm.address.toLowerCase()}`
        if (!attemptedRef.current.has(key)) {
          attemptedRef.current.add(key)
          jobs.push({ chain: 'evm', address: evm.address, setAsClaim: !status?.user?.claimAddresses?.evm, primary: true })
        }
      }

      if (solAddress && !hasWallet(status, 'solana', solAddress)) {
        const key = `solana:${solAddress}`
        if (!attemptedRef.current.has(key)) {
          attemptedRef.current.add(key)
          jobs.push({ chain: 'solana', address: solAddress, setAsClaim: false, primary: false })
        }
      }

      if (jobs.length === 0) {
        await lookupConnectedWallets()
        return
      }

      autoLinkingRef.current = true
      setBusy(true)
      setError('')
      try {
        let latest = status
        for (const job of jobs) {
          const res = await accountApi.linkWallet(job)
          latest = res.status || latest
        }
        updateStatus(latest)
        await lookupConnectedWallets()
        setMessage(jobs.map((j) => `${j.chain.toUpperCase()} wallet linked`).join(' + '))
      } catch (err) {
        await lookupConnectedWallets()
        setError(err.message || 'Wallet link failed')
      } finally {
        autoLinkingRef.current = false
        setBusy(false)
      }
    }

    autoLink()
  }, [evm.address, solAddress, status, busy, lookupConnectedWallets])

  function openAppKit(namespace) {
    const connected = namespace === 'eip155' ? evm.isConnected : sol.isConnected
    open({ view: connected ? 'Account' : 'Connect', namespace })
  }

  const telegramOk = Boolean(status?.telegramVerified || status?.user?.telegram?.verified)
  const evmLinked = Boolean(evm.address && hasWallet(status, 'evm', evm.address))
  const solLinked = Boolean(solAddress && hasWallet(status, 'solana', solAddress))
  const registered = Boolean(status?.registered)
  const lookupMessage = summarizeLookup(walletLookup?.matches || [])
  const anyConnectedWallet = Boolean(evm.address || solAddress)
  const claimAddress = status?.user?.claimAddresses?.evm || ''

  if (mode === 'hidden') return null

  return (
    <Section title="Accounts" subtitle="Connect and manage the wallets linked to your Telegram migration account.">
      <Stack spacing={1.5}>
        <Box className="chip-wrap">
          <StatusPill label={telegramOk ? 'Telegram verified' : 'Open from Telegram'} ok={telegramOk} />
          <StatusPill label={registered ? 'Registered' : 'Not fully registered'} ok={registered} />
          <StatusPill label={evmLinked ? 'BSC linked' : evm.address ? 'BSC connected' : 'BSC not connected'} ok={evmLinked} neutral={!evm.address} />
          <StatusPill label={solLinked ? 'Solana linked' : solAddress ? 'Solana connected' : 'Solana not connected'} ok={solLinked} neutral={!solAddress} />
        </Box>

        {message ? <Alert severity="success">{message}</Alert> : null}
        {error ? <Alert severity="error">{error}</Alert> : null}
        {!telegramOk && anyConnectedWallet && lookupMessage ? <Alert severity="info">{lookupMessage}</Alert> : null}

        <Box className="wallet-modal-summary">
          <InfoRow label="Telegram" value={telegramOk ? 'verified' : 'not verified'} />
          <InfoRow label="BSC / EVM wallet" value={evm.address ? short(evm.address) : 'not connected'} />
          <InfoRow label="Solana wallet" value={solAddress ? short(solAddress) : 'not connected'} />
          <InfoRow label="Final claim address" value={claimAddress ? short(claimAddress) : 'not set'} />
        </Box>

        <Stack spacing={1}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<AccountBalanceWalletIcon />}
            onClick={() => openAppKit('eip155')}
          >
            {evm.isConnected ? `Open BSC / EVM wallet ${short(evm.address)}` : 'Connect BSC / EVM wallet'}
          </Button>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<AccountBalanceWalletIcon />}
            onClick={() => openAppKit('solana')}
          >
            {sol.isConnected ? `Open Solana wallet ${short(solAddress || sol.address)}` : 'Connect Solana wallet'}
          </Button>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          {TELEGRAM_BOT_URL ? <Button fullWidth startIcon={<TelegramIcon />} href={TELEGRAM_BOT_URL}>Open Telegram</Button> : null}
          <Button fullWidth startIcon={<RefreshIcon />} onClick={loadMe} disabled={busy}>{busy ? 'Checking...' : 'Recheck account'}</Button>
        </Stack>

        <Typography variant="caption" color="text.secondary">
          Use BSC/EVM for MOON deposits and final migration claim address. Use Solana for SVM deposits.
        </Typography>
      </Stack>
    </Section>
  )
}
