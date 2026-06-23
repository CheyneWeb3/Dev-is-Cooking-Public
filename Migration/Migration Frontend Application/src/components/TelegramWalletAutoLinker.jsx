import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material'
import { useAppKitAccount } from '@reown/appkit/react'
import { isAddress } from 'ethers'
import { accountApi, authApi, telegramApi } from '../api/client.js'
import { TELEGRAM_BOT_URL } from '../config/env.js'

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
  const parts = linked.map((m) => ``)
  return `Open from Telegram to restore/check the account session before linking wallets.`
}

export function TelegramWalletAutoLinker({ refreshKey = 0, onRefresh }) {
  const evm = useAppKitAccount({ namespace: 'eip155' })
  const sol = useAppKitAccount({ namespace: 'solana' })
  const [status, setStatus] = useState(null)
  const [walletLookup, setWalletLookup] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [detailsOpen, setDetailsOpen] = useState(false)
  const consumedRef = useRef(false)
  const attemptedRef = useRef(new Set())

  const tgCode = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return new URLSearchParams(window.location.search).get('tgCode') || ''
  }, [])

  const lookupConnectedWallets = useCallback(async () => {
    const wallets = connectedWallets(evm.address, sol.address)
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
  }, [evm.address, sol.address])

  const loadMe = useCallback(async () => {
    try {
      const res = await authApi.me()
      const nextStatus = res.status || res
      setStatus(nextStatus)
      setError('')
      await lookupConnectedWallets()
      return nextStatus
    } catch (err) {
      setStatus(null)
      await lookupConnectedWallets()
      return null
    }
  }, [lookupConnectedWallets])

  useEffect(() => {
    async function boot() {
      setBusy(true)
      setError('')
      setMessage('')
      try {
        if (tgCode && !consumedRef.current) {
          consumedRef.current = true
          const url = new URL(window.location.href)
          url.searchParams.delete('tgCode')
          window.history.replaceState({}, '', url.toString())
          const res = await telegramApi.consumeOpenAppCode(tgCode)
          const nextStatus = res.status || null
          setStatus(nextStatus)
          setMessage('Telegram session restored.')
          await lookupConnectedWallets()
          onRefresh?.()
          return
        }
        await loadMe()
      } catch (err) {
        setStatus(null)
        setError(err.message || 'Telegram link failed. Open the app from Telegram again.')
        await lookupConnectedWallets()
      } finally {
        setBusy(false)
      }
    }

    boot()
  }, [tgCode, loadMe, lookupConnectedWallets, onRefresh, refreshKey])

  useEffect(() => {
    async function autoLink() {
      if (!status?.telegramVerified && !status?.user?.telegram?.verified) {
        await lookupConnectedWallets()
        return
      }
      if (busy) return

      const jobs = []

      if (evm.address && isAddress(evm.address) && !hasWallet(status, 'evm', evm.address)) {
        const key = `evm:${evm.address.toLowerCase()}`
        if (!attemptedRef.current.has(key)) {
          attemptedRef.current.add(key)
          jobs.push({ chain: 'evm', address: evm.address, setAsClaim: !status?.user?.claimAddresses?.evm, primary: true })
        }
      }

      if (sol.address && !hasWallet(status, 'solana', sol.address)) {
        const key = `solana:${sol.address}`
        if (!attemptedRef.current.has(key)) {
          attemptedRef.current.add(key)
          jobs.push({ chain: 'solana', address: sol.address, setAsClaim: false, primary: false })
        }
      }

      if (jobs.length === 0) {
        await lookupConnectedWallets()
        return
      }

      setBusy(true)
      setError('')
      try {
        let latest = status
        for (const job of jobs) {
          const res = await accountApi.linkWallet(job)
          latest = res.status || latest
        }
        setStatus(latest)
        await lookupConnectedWallets()
        setMessage(jobs.map((j) => `${j.chain.toUpperCase()} wallet linked`).join(' + '))
        onRefresh?.()
      } catch (err) {
        await lookupConnectedWallets()
        setError(err.message || 'Wallet link failed')
      } finally {
        setBusy(false)
      }
    }

    autoLink()
  }, [evm.address, sol.address, status, busy, onRefresh, lookupConnectedWallets])

  const telegramOk = Boolean(status?.telegramVerified || status?.user?.telegram?.verified)
  const evmLinked = Boolean(evm.address && hasWallet(status, 'evm', evm.address))
  const solLinked = Boolean(sol.address && hasWallet(status, 'solana', sol.address))
  const registered = Boolean(status?.registered)
  const lookupMessage = summarizeLookup(walletLookup?.matches || [])
  const anyConnectedWallet = Boolean(evm.address || sol.address)

  const summary = telegramOk
    ? registered
      ? 'Telegram linked. Registration complete.'
      : 'Telegram linked. Wallets will auto-link when connected.'
    : anyConnectedWallet
      ? 'Wallet connected, but Telegram session is not active.'
      : 'Open from Telegram to start registration.'

  return (
    <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
      <Stack spacing={1.25}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
          <Box>
            <Typography variant="subtitle2" fontWeight={900}>Registration sync</Typography>
            <Typography variant="body2" color="text.secondary">{busy ? 'Checking Telegram and wallet links...' : summary}</Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button size="small" variant="outlined" onClick={loadMe} disabled={busy}>Recheck</Button>
            <Button size="small" variant="text" onClick={() => setDetailsOpen(true)}>Details</Button>
            {!telegramOk && TELEGRAM_BOT_URL ? <Button size="small" variant="contained" href={TELEGRAM_BOT_URL}>Open Telegram</Button> : null}
          </Stack>
        </Stack>

        {!telegramOk && anyConnectedWallet && lookupMessage ? <Alert severity="info">{lookupMessage}</Alert> : null}
        {!telegramOk && anyConnectedWallet && !lookupMessage ? <Alert severity="warning">Wallet connected, but no active Telegram session was found. Open from Telegram to link this wallet.</Alert> : null}
        {message ? <Alert severity="success">{message}</Alert> : null}
        {error ? <Alert severity="error">{error}</Alert> : null}

        <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Telegram and backend wallet links</DialogTitle>
          <DialogContent>
            <Stack spacing={1.25} sx={{ pt: 1 }}>
              <Box className="chip-wrap" sx={{ mt: 1 }}>
                <Chip label={`Telegram session: ${telegramOk ? 'active' : 'not active'}`} color={telegramOk ? 'success' : 'warning'} />
                <Chip label={`EVM backend link: ${evmLinked ? 'yes' : 'no'}`} color={evmLinked ? 'success' : evm.address ? 'warning' : 'default'} />
                <Chip label={`Solana backend link: ${solLinked ? 'yes' : 'no'}`} color={solLinked ? 'success' : sol.address ? 'warning' : 'default'} />
                <Chip label={`Registered: ${registered ? 'yes' : 'no'}`} color={registered ? 'success' : 'warning'} />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Connected wallets are browser state. Backend registration only happens after Telegram is linked and wallets are saved to the Telegram account.
              </Typography>
              {evm.address ? <Typography variant="body2">Connected EVM: {short(evm.address)}</Typography> : null}
              {sol.address ? <Typography variant="body2">Connected Solana: {short(sol.address)}</Typography> : null}
            </Stack>
          </DialogContent>
          <DialogActions>
            {TELEGRAM_BOT_URL ? <Button href={TELEGRAM_BOT_URL}>Open Telegram bot</Button> : null}
            <Button onClick={loadMe} disabled={busy}>Recheck</Button>
            <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Box>
  )
}
