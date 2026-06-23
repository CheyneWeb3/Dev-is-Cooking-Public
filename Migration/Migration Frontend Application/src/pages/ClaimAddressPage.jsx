import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Button, Chip, Stack, TextField, Typography } from '@mui/material'
import { useAppKitAccount } from '@reown/appkit/react'
import { isAddress } from 'ethers'
import { accountApi } from '../api/client.js'
import { Section } from '../components/Section.jsx'
import { StatusAlert } from '../components/StatusAlert.jsx'

function short(address) {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function firstLinkedEvm(user) {
  const wallets = user?.evmWallets || []
  return wallets.find((w) => w.primary)?.address || wallets[0]?.address || ''
}

export function ClaimAddressPage({ onRefresh }) {
  const evm = useAppKitAccount({ namespace: 'eip155' })
  const [status, setStatus] = useState(null)
  const [address, setAddress] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const savedClaim = status?.user?.claimAddresses?.evm || ''
  const linkedEvm = useMemo(() => firstLinkedEvm(status?.user), [status])
  const suggested = savedClaim || linkedEvm || evm.address || ''

  async function loadStatus() {
    try {
      const res = await accountApi.claimStatus()
      setStatus(res)
      const next = res?.user?.claimAddresses?.evm || firstLinkedEvm(res?.user) || evm.address || ''
      setAddress((current) => current || next)
    } catch (err) {
      setStatus(null)
      if (!address && evm.address) setAddress(evm.address)
    }
  }

  useEffect(() => { loadStatus() }, [])
  useEffect(() => {
    if (!address && suggested) setAddress(suggested)
  }, [suggested, address])

  async function useConnected() {
    if (evm.address) setAddress(evm.address)
  }

  async function useLinked() {
    if (linkedEvm) setAddress(linkedEvm)
  }

  async function save() {
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      if (!isAddress(address)) throw new Error('Enter a valid EVM/BSC address')

      if (evm.address && evm.address.toLowerCase() === address.toLowerCase()) {
        await accountApi.linkWallet({ chain: 'evm', address, setAsClaim: true, primary: true })
      } else {
        await accountApi.setClaimAddress(address)
      }

      await loadStatus()
      setSuccess(savedClaim && savedClaim.toLowerCase() !== address.toLowerCase() ? 'EVM claim address changed.' : 'EVM claim address saved.')
      onRefresh?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Section title="EVM claim address" subtitle="Final claim is EVM/BSC only. You can use a linked wallet or enter a different EVM address.">
      <StatusAlert error={error} success={success} />

      {savedClaim ? (
        <Alert severity="success">
          Claim address already set: <b>{savedClaim}</b>. You can change it below if needed.
        </Alert>
      ) : linkedEvm ? (
        <Alert severity="info">
          A linked EVM wallet was found and prefilled: <b>{linkedEvm}</b>. Save it to complete the claim address step.
        </Alert>
      ) : evm.address ? (
        <Alert severity="info">
          Connected EVM wallet detected and prefilled: <b>{evm.address}</b>. Save it to complete registration.
        </Alert>
      ) : (
        <Alert severity="warning">No EVM claim address is set yet. Connect an EVM wallet or paste the address that should receive the final claim.</Alert>
      )}

      <Box className="chip-wrap" sx={{ mt: 2 }}>
        <Chip label={`Telegram: ${status?.telegramVerified || status?.user?.telegram?.verified ? 'verified' : 'not verified'}`} color={status?.telegramVerified || status?.user?.telegram?.verified ? 'success' : 'default'} />
        <Chip label={`Linked EVM wallets: ${status?.evmWalletCount ?? status?.user?.evmWallets?.length ?? 0}`} />
        <Chip label={`Claim: ${savedClaim ? 'set' : 'not set'}`} color={savedClaim ? 'success' : 'warning'} />
      </Box>

      <Typography color="text.secondary">
        This address is where the final new token claim should be sent. It can be your connected BSC wallet or another EVM address you control.
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <TextField fullWidth label="EVM claim address" value={address} onChange={(e) => setAddress(e.target.value)} />
        <Button variant="outlined" onClick={useLinked} disabled={!linkedEvm}>Use linked {linkedEvm ? short(linkedEvm) : ''}</Button>
        <Button variant="outlined" onClick={useConnected} disabled={!evm.address}>Use connected</Button>
        <Button variant="contained" onClick={save} disabled={busy}>{savedClaim ? 'Update' : 'Save'}</Button>
      </Stack>
    </Section>
  )
}
