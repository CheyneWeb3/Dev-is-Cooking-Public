import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Button, Divider, Stack, TextField, Typography } from '@mui/material'
import TelegramIcon from '@mui/icons-material/Telegram'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import RefreshIcon from '@mui/icons-material/Refresh'
import { useAppKit, useAppKitAccount } from '@reown/appkit/react'
import { isAddress } from 'ethers'
import { Section } from '../components/Section.jsx'
import { StatusAlert } from '../components/StatusAlert.jsx'
import { accountApi } from '../api/client.js'
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

function firstLinkedEvm(user) {
  const wallets = user?.evmWallets || []
  return wallets.find((w) => w.primary)?.address || wallets[0]?.address || ''
}

function CheckRow({ label, value, ok }) {
  return (
    <Box className={`check-row ${ok ? 'ok' : 'need'}`}>
      <Box sx={{ minWidth: 0 }}>
        <Typography fontWeight={850}>{label}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>{value}</Typography>
      </Box>
      <Typography variant="caption" fontWeight={900}>{ok ? 'OK' : 'Needed'}</Typography>
    </Box>
  )
}

export function StartPage({ onRefresh, accountStatus }) {
  const { open } = useAppKit()
  const evm = useAppKitAccount({ namespace: 'eip155' })
  const sol = useAppKitAccount({ namespace: 'solana' })
  const [status, setStatus] = useState(accountStatus || null)
  const [claimAddressInput, setClaimAddressInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (accountStatus) setStatus(accountStatus)
  }, [accountStatus])

  const telegramOk = Boolean(status?.telegramVerified || status?.user?.telegram?.verified)
  const savedClaim = status?.user?.claimAddresses?.evm || ''
  const linkedEvm = useMemo(() => firstLinkedEvm(status?.user), [status])
  const evmLinked = Boolean(evm.address && hasWallet(status, 'evm', evm.address))
  const solLinked = Boolean(sol.address && hasWallet(status, 'solana', sol.address))
  const linkedWalletCount = Number(status?.evmWalletCount ?? status?.user?.evmWallets?.length ?? 0) + Number(status?.solanaWalletCount ?? status?.user?.solanaWallets?.length ?? 0)
  const hasAnyLinkedWallet = linkedWalletCount > 0 || evmLinked || solLinked
  const registrationComplete = telegramOk && hasAnyLinkedWallet && Boolean(savedClaim)
  const suggestedClaim = savedClaim || linkedEvm || evm.address || ''

  useEffect(() => {
    if (!claimAddressInput && suggestedClaim) setClaimAddressInput(suggestedClaim)
  }, [suggestedClaim, claimAddressInput])

  async function loadStatus() {
    setBusy(true)
    setError('')
    try {
      const res = await accountApi.claimStatus()
      setStatus(res)
      onRefresh?.()
      return res
    } catch (err) {
      setError(err.message || 'Could not load registration status')
      return null
    } finally {
      setBusy(false)
    }
  }

  async function connectWallet(namespace) {
    setError('')
    setSuccess('')
    open({ view: 'Connect', namespace })
  }

  async function linkEvm({ setAsClaim = true } = {}) {
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      if (!telegramOk) throw new Error('Open from Telegram first, then link wallets.')
      if (!evm.address) throw new Error('Connect your BSC/EVM wallet first.')
      if (!isAddress(evm.address)) throw new Error('Connected EVM address is invalid.')
      const res = await accountApi.linkWallet({ chain: 'evm', address: evm.address, setAsClaim, primary: true })
      const next = res.status || await accountApi.claimStatus()
      setStatus(next)
      setClaimAddressInput(next?.user?.claimAddresses?.evm || evm.address)
      setSuccess(setAsClaim ? 'BSC wallet linked and saved as claim address.' : 'BSC wallet linked.')
      onRefresh?.()
    } catch (err) {
      setError(err.message || 'EVM wallet link failed')
    } finally {
      setBusy(false)
    }
  }

  async function linkSolana() {
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      if (!telegramOk) throw new Error('Open from Telegram first, then link wallets.')
      if (!sol.address) throw new Error('Connect your Solana wallet first.')
      const res = await accountApi.linkWallet({ chain: 'solana', address: sol.address, primary: false })
      const next = res.status || await accountApi.claimStatus()
      setStatus(next)
      setSuccess('Solana wallet linked for SVM deposits.')
      onRefresh?.()
    } catch (err) {
      setError(err.message || 'Solana wallet link failed')
    } finally {
      setBusy(false)
    }
  }

  async function saveClaimAddress() {
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      if (!telegramOk) throw new Error('Open from Telegram first.')
      if (!hasAnyLinkedWallet) throw new Error('Link at least one wallet first.')
      if (!isAddress(claimAddressInput)) throw new Error('Enter a valid EVM/BSC claim address.')

      if (evm.address && sameAddress(evm.address, claimAddressInput)) {
        await accountApi.linkWallet({ chain: 'evm', address: claimAddressInput, setAsClaim: true, primary: true })
      } else {
        await accountApi.setClaimAddress(claimAddressInput)
      }

      const next = await accountApi.claimStatus()
      setStatus(next)
      setSuccess('Claim address saved.')
      onRefresh?.()
    } catch (err) {
      setError(err.message || 'Could not save claim address')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Section title="Register" subtitle="One account: Telegram + wallet link + claim address.">
      <StatusAlert error={error} success={success} />

      {registrationComplete ? (
        <Alert severity="success" className="compact-alert">Registration complete. You can deposit from linked wallets.</Alert>
      ) : (
        <Alert severity="info" className="compact-alert">Open from Telegram first, then connect and link the wallet you will deposit from.</Alert>
      )}

      <Stack spacing={0.8}>
        <CheckRow label="Telegram" value={telegramOk ? 'Verified' : 'Open the Telegram bot link'} ok={telegramOk} />
        <CheckRow label="Wallet linked" value={hasAnyLinkedWallet ? `${linkedWalletCount || 1} linked` : 'Link BSC for MOON or Solana for SVM'} ok={hasAnyLinkedWallet} />
        <CheckRow label="Claim address" value={savedClaim ? short(savedClaim) : 'Set final EVM/BSC claim address'} ok={Boolean(savedClaim)} />
      </Stack>

      {!registrationComplete ? (
        <Stack spacing={1.2}>
          <Divider />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            {TELEGRAM_BOT_URL ? (
              <Button startIcon={<TelegramIcon />} variant={telegramOk ? 'outlined' : 'contained'} href={TELEGRAM_BOT_URL}>
                Open Telegram
              </Button>
            ) : null}
            <Button startIcon={<RefreshIcon />} variant="outlined" onClick={loadStatus} disabled={busy}>Recheck</Button>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button startIcon={<AccountBalanceWalletIcon />} variant={evm.address ? 'outlined' : 'contained'} onClick={() => connectWallet('eip155')}>
              {evm.address ? `BSC ${short(evm.address)}` : 'Connect BSC'}
            </Button>
            <Button variant={sol.address ? 'outlined' : 'contained'} onClick={() => connectWallet('solana')}>
              {sol.address ? `Solana ${short(sol.address)}` : 'Connect Solana'}
            </Button>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button variant="contained" onClick={() => linkEvm({ setAsClaim: true })} disabled={busy || !telegramOk || !evm.address}>
              Link BSC + claim
            </Button>
            <Button variant="outlined" onClick={linkSolana} disabled={busy || !telegramOk || !sol.address}>
              Link Solana
            </Button>
          </Stack>
        </Stack>
      ) : null}

      <Box className="claim-box">
        <Typography variant="caption" color="text.secondary">Final EVM/BSC claim address</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="stretch">
          <TextField
            fullWidth
            value={claimAddressInput}
            onChange={(e) => setClaimAddressInput(e.target.value)}
            placeholder="0x..."
          />
          <Button variant="outlined" onClick={() => setClaimAddressInput(linkedEvm || evm.address || '')} disabled={!linkedEvm && !evm.address}>
            Use linked
          </Button>
          <Button variant="contained" onClick={saveClaimAddress} disabled={busy || !telegramOk || !hasAnyLinkedWallet}>
            Save
          </Button>
        </Stack>
      </Box>
    </Section>
  )
}
