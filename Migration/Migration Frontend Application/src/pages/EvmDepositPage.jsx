import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Button, Chip, Link, Paper, Stack, TextField, Typography } from '@mui/material'
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react'
import { BrowserProvider, Contract, Interface, formatUnits, parseUnits } from 'ethers'
import { accountApi, depositApi, publicApi } from '../api/client.js'
import { API_BASE, BSC_CHAIN_ID, BSC_CHAIN_ID_HEX } from '../config/env.js'
import { FALLBACK_DEPOSIT_TOKENS, shortAddress } from '../config/depositTokens.js'
import { Section } from '../components/Section.jsx'
import { StatusAlert } from '../components/StatusAlert.jsx'
import { ProcessingModal } from '../components/ProcessingModal.jsx'

const ERC20_ABI = [
  'function transfer(address to,uint256 value) returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function balanceOf(address owner) view returns (uint256)'
]

const ERC20_TRANSFER_INTERFACE = new Interface(['function transfer(address to,uint256 value) returns (bool)'])

function toBigIntSafe(value) {
  try { return BigInt(value || '0') } catch { return 0n }
}

function normalizeAllowance(raw) {
  if (!raw) return null
  const data = raw.allowance || raw
  const remainingBaseUnits = data.remainingAmountBaseUnits || data.remainingBaseUnits || data.remaining || data.remainingAllowedBaseUnits || '0'
  return {
    found: Boolean(data.found ?? data.exists ?? raw.found),
    snapshotAmountUi: data.snapshotAmountUi || data.snapshotUi || data.snapshotAmount || '0',
    alreadyDepositedUi: data.alreadyDepositedUi || data.depositedUi || data.usedAmountUi || '0',
    remainingUi: data.remainingUi || data.remainingAmountUi || data.remainingAllowedUi || '0',
    remainingBaseUnits: String(remainingBaseUnits || '0'),
    reason: data.reason || raw.reason || ''
  }
}

function decimalMin(a, b) {
  const na = Number(a || '0')
  const nb = Number(b || '0')
  if (!Number.isFinite(na) || na <= 0) return b || ''
  if (!Number.isFinite(nb) || nb <= 0) return '0'
  return na < nb ? a : b
}

const EVM_PENDING_SUBMISSIONS_KEY = 'migratetokens.pendingEvmSubmissions.v1'
const EVM_ACTIVE_INTENTS_KEY = 'migratetokens.activeEvmIntents.v1'

function getIntentDepositId(intent = {}) {
  return intent.depositId || intent.id || intent._id || intent.deposit?._id || intent.deposit?.id || ''
}

function getIntentDestination(intent = {}) {
  return intent.to || intent.destinationWallet || intent.depositAddress || intent.evmTo || intent.deposit?.destinationWallet || ''
}

function readPendingSubmissions() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(EVM_PENDING_SUBMISSIONS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((x) => x?.depositId && x?.txHash) : []
  } catch {
    return []
  }
}

function writePendingSubmissions(items) {
  if (typeof window === 'undefined') return
  const clean = Array.isArray(items) ? items.filter((x) => x?.depositId && x?.txHash) : []
  window.localStorage.setItem(EVM_PENDING_SUBMISSIONS_KEY, JSON.stringify(clean.slice(-10)))
}

function upsertPendingSubmission(item) {
  const items = readPendingSubmissions().filter((x) => x.depositId !== item.depositId && x.txHash !== item.txHash)
  items.push({ ...item, savedAt: item.savedAt || new Date().toISOString() })
  writePendingSubmissions(items)
}

function removePendingSubmission(depositId, txHash) {
  writePendingSubmissions(readPendingSubmissions().filter((x) => x.depositId !== depositId && x.txHash !== txHash))
}

function readActiveIntents() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(EVM_ACTIVE_INTENTS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((x) => x?.depositId) : []
  } catch {
    return []
  }
}

function writeActiveIntents(items) {
  if (typeof window === 'undefined') return
  const clean = Array.isArray(items) ? items.filter((x) => x?.depositId) : []
  window.localStorage.setItem(EVM_ACTIVE_INTENTS_KEY, JSON.stringify(clean.slice(-10)))
}

function upsertActiveIntent(item) {
  const items = readActiveIntents().filter((x) => x.depositId !== item.depositId)
  items.push({ ...item, savedAt: item.savedAt || new Date().toISOString() })
  writeActiveIntents(items)
}

function removeActiveIntent(depositId) {
  writeActiveIntents(readActiveIntents().filter((x) => x.depositId !== depositId))
}

function isUserRejectedWalletError(err) {
  const code = err?.code || err?.info?.error?.code || err?.error?.code
  const msg = `${err?.message || err?.shortMessage || err?.reason || err || ''}`
  return code === 4001 || code === 'ACTION_REJECTED' || /user rejected|user denied|rejected the request|request rejected|cancelled|canceled|denied/i.test(msg)
}

function extractEvmTxHash(tx) {
  if (!tx) return ''
  if (typeof tx === 'string') return tx
  return tx.hash || tx.transactionHash || tx.txHash || tx.result || ''
}

async function postEvmTxHash(depositId, txHash) {
  const body = JSON.stringify({ txHash })
  const res = await fetch(`${API_BASE}/api/evm-deposits/${depositId}/submit`, {
    method: 'POST',
    credentials: 'include',
    keepalive: true,
    headers: { 'Content-Type': 'application/json' },
    body
  })
  const text = await res.text()
  let data = null
  try { data = text ? JSON.parse(text) : null } catch { data = { raw: text } }
  if (!res.ok) throw new Error(data?.error || `Request failed: ${res.status}`)
  return data
}

function bscTxUrl(txHash) {
  return txHash ? `https://bscscan.com/tx/${txHash}` : ''
}

function AllowanceCard({ allowance, walletAddress }) {
  if (!walletAddress) return null
  if (!allowance) {
    return (
      <Alert severity="info">Connect wallet and load allowance before depositing. The deposit cap comes from the MOON holder snapshot.</Alert>
    )
  }
  if (!allowance.found) {
    return (
      <Alert severity="warning">This BSC wallet was not found in the MOON snapshot, so it cannot deposit MOON for this migration.</Alert>
    )
  }
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>

    </Paper>
  )
}

export function EvmDepositPage({ onRefresh }) {
  const { open } = useAppKit()
  const evm = useAppKitAccount({ namespace: 'eip155' })
  const { walletProvider } = useAppKitProvider('eip155')
  const [token, setToken] = useState(FALLBACK_DEPOSIT_TOKENS.evm)
  const [decimals, setDecimals] = useState(null)
  const [chainSymbol, setChainSymbol] = useState('')
  const [amount, setAmount] = useState('')
  const [walletBalance, setWalletBalance] = useState('')
  const [allowance, setAllowance] = useState(null)
  const [allowanceBusy, setAllowanceBusy] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [processModal, setProcessModal] = useState({ open: false, busy: false, message: '', success: '', error: '' })
  const [pendingSubmissions, setPendingSubmissions] = useState(() => readPendingSubmissions())
  const [activeIntents, setActiveIntents] = useState(() => readActiveIntents())
  const [lastTxHash, setLastTxHash] = useState('')

  const remainingBaseUnits = useMemo(() => toBigIntSafe(allowance?.remainingBaseUnits), [allowance])
  const cannotDepositBySnapshot = evm.address && allowance && (!allowance.found || remainingBaseUnits <= 0n)

  useEffect(() => {
    async function loadAllowedToken() {
      try {
        const res = await publicApi.depositTokens()
        if (res?.tokens?.evm?.tokenContract) setToken(res.tokens.evm)
      } catch {
        setToken(FALLBACK_DEPOSIT_TOKENS.evm)
      }
    }
    loadAllowedToken()
  }, [])

  useEffect(() => {
    if (evm.address && walletProvider && token?.tokenContract) {
      loadWalletBalance()
      loadSnapshotAllowance(evm.address)
    } else {
      setAllowance(null)
    }
  }, [evm.address, walletProvider, token?.tokenContract])

  async function ensureBsc() {
    if (!walletProvider?.request) return
    try {
      await walletProvider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: BSC_CHAIN_ID_HEX }] })
    } catch (err) {
      if (err?.code === 4902) {
        await walletProvider.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: BSC_CHAIN_ID_HEX,
            chainName: 'BNB Smart Chain',
            nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
            rpcUrls: ['https://bsc-dataseed.binance.org'],
            blockExplorerUrls: ['https://bscscan.com']
          }]
        })
      } else {
        throw err
      }
    }
  }

  async function readTokenMeta() {
    const provider = new BrowserProvider(walletProvider)
    const signer = await provider.getSigner()
    const tokenContract = new Contract(token.tokenContract, ERC20_ABI, signer)
    const [dec, sym] = await Promise.all([
      tokenContract.decimals(),
      tokenContract.symbol().catch(() => token.symbol)
    ])
    const normalizedDecimals = Number(dec)
    if (!Number.isInteger(normalizedDecimals) || normalizedDecimals < 0 || normalizedDecimals > 36) {
      throw new Error('Token decimals could not be read correctly')
    }
    setDecimals(normalizedDecimals)
    setChainSymbol(sym || token.symbol)
    return { provider, signer, tokenContract, decimals: normalizedDecimals, symbol: sym || token.symbol }
  }

  async function loadSnapshotAllowance(address = evm.address) {
    setAllowanceBusy(true)
    try {
      if (!address) return null
      const res = await accountApi.snapshotAllowance({
        chain: 'evm',
        network: 'bsc',
        walletAddress: address,
        token: token.symbol || 'MOON',
        tokenMintOrContract: token.tokenContract
      })
      const normalized = normalizeAllowance(res)
      setAllowance(normalized)
      return normalized
    } catch (err) {
      setAllowance({ found: false, snapshotAmountUi: '0', alreadyDepositedUi: '0', remainingUi: '0', remainingBaseUnits: '0', reason: err.message })
      return null
    } finally {
      setAllowanceBusy(false)
    }
  }

  async function loadWalletBalance() {
    setError('')
    try {
      if (!evm.address) throw new Error('Connect BSC wallet first')
      if (!walletProvider) throw new Error('Wallet provider not available')
      await ensureBsc()
      const meta = await readTokenMeta()
      const balance = await meta.tokenContract.balanceOf(evm.address)
      const formatted = formatUnits(balance, meta.decimals)
      setWalletBalance(formatted)
      return formatted
    } catch (err) {
      setError(err.message || 'Could not read MOON balance')
      return ''
    }
  }

  async function setMaxAmount() {
    const balance = walletBalance || await loadWalletBalance()
    const currentAllowance = allowance || await loadSnapshotAllowance()
    if (currentAllowance?.found && currentAllowance.remainingUi) {
      setAmount(decimalMin(balance, currentAllowance.remainingUi))
      return
    }
    if (balance) setAmount(balance)
  }

  function connectBscWallet() {
    open({ view: 'Connect', namespace: 'eip155' })
  }

  function syncPendingSubmissions() {
    setPendingSubmissions(readPendingSubmissions())
    setActiveIntents(readActiveIntents())
  }

  async function submitAndTrackEvmTx(pending, { showMessages = true } = {}) {
    if (!pending?.depositId || !pending?.txHash) throw new Error('Missing EVM deposit id or tx hash')
    upsertPendingSubmission(pending)
    syncPendingSubmissions()

    if (showMessages) setSuccess(`EVM transaction sent. Saving hash to backend: ${pending.txHash}`)
    await postEvmTxHash(pending.depositId, pending.txHash)

    removePendingSubmission(pending.depositId, pending.txHash)
    syncPendingSubmissions()
    if (showMessages) setSuccess(`MOON deposit submitted to backend. Waiting for worker confirmation: ${pending.txHash}`)
    onRefresh?.()
  }

  async function retryPendingSubmissions({ quiet = false } = {}) {
    const items = readPendingSubmissions()
    if (!items.length) {
      syncPendingSubmissions()
      return
    }

    for (const item of items) {
      try {
        await submitAndTrackEvmTx(item, { showMessages: !quiet })
      } catch (err) {
        if (!quiet) setError(`Could not resubmit saved EVM tx hash yet: ${err.message}`)
      }
    }
    syncPendingSubmissions()
  }

  useEffect(() => {
    retryPendingSubmissions({ quiet: true })
    const timer = setInterval(() => retryPendingSubmissions({ quiet: true }), 8000)
    return () => clearInterval(timer)
  }, [])

  async function handlePrimaryAction() {
    if (!evm.address || !walletProvider) {
      connectBscWallet()
      return
    }
    await deposit()
  }

  async function deposit() {
    let createdDepositId = ""
    let txHashSubmitted = false
    setBusy(true)
    setError('')
    setSuccess('')
    setProcessModal({ open: true, busy: true, message: 'Preparing MOON deposit...', success: '', error: '' })
    try {
      if (!evm.address) throw new Error('Connect BSC wallet first')
      if (!walletProvider) throw new Error('Wallet provider not available')
      if (!amount || Number(amount) <= 0) throw new Error('Amount must be greater than zero')

      await ensureBsc()
      const meta = await readTokenMeta()
      const currentAllowance = allowance || await loadSnapshotAllowance(evm.address)
      if (!currentAllowance?.found) throw new Error('This BSC wallet is not in the MOON snapshot')
      const amountBaseUnits = parseUnits(amount, meta.decimals).toString()
      if (BigInt(amountBaseUnits) <= 0n) throw new Error('Amount must be greater than zero')
      if (toBigIntSafe(amountBaseUnits) > toBigIntSafe(currentAllowance.remainingBaseUnits)) {
        throw new Error(`Amount exceeds snapshot allowance. Remaining: ${currentAllowance.remainingUi} MOON`)
      }

      await accountApi.linkWallet({ chain: 'evm', address: evm.address, setAsClaim: false, primary: false })

      const intent = await depositApi.evmIntent({
        network: 'bsc',
        chainId: token.chainId || BSC_CHAIN_ID,
        walletAddress: evm.address,
        tokenContract: token.tokenContract,
        tokenSymbol: token.symbol,
        decimals: meta.decimals,
        amountUi: amount,
        amountBaseUnits
      })

      const depositId = getIntentDepositId(intent)
      createdDepositId = depositId
      const destination = getIntentDestination(intent)
      if (!depositId) throw new Error('Backend did not return an EVM deposit id')
      if (!destination) throw new Error('Backend did not return an EVM deposit address')

      const activeIntent = {
        depositId,
        chain: 'evm',
        network: 'bsc',
        tokenSymbol: token.symbol || 'MOON',
        amountUi: amount,
        amountBaseUnits,
        sourceWallet: evm.address,
        destinationWallet: destination,
        tokenContract: token.tokenContract,
        startedAt: new Date().toISOString()
      }
      upsertActiveIntent(activeIntent)

      setSuccess('Confirm the MOON transfer in your wallet. The app will save the tx hash immediately after wallet submission.')
      setProcessModal({ open: true, busy: true, message: 'Confirm the MOON transfer in your wallet.', success: '', error: '' })

      // Use the raw wallet RPC call instead of waiting through the ethers Contract wrapper.
      // MetaMask/Reown returns the tx hash directly from eth_sendTransaction, so we can save it immediately.
      const transferData = ERC20_TRANSFER_INTERFACE.encodeFunctionData('transfer', [destination, amountBaseUnits])
      const rawTxHash = await walletProvider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: evm.address,
          to: token.tokenContract,
          data: transferData,
          value: '0x0'
        }]
      })

      const txHash = extractEvmTxHash(rawTxHash)
      if (!txHash) throw new Error('Wallet returned no EVM transaction hash')

      const pending = {
        ...activeIntent,
        txHash,
        savedAt: new Date().toISOString()
      }

      // Critical ordering: persist tx hash locally before any network call or UI refresh.
      // If the user refreshes right now, the retry loop will still submit this hash to backend.
      upsertPendingSubmission(pending)
      removeActiveIntent(depositId)
      syncPendingSubmissions()
      setLastTxHash(txHash)
      txHashSubmitted = true

      setProcessModal({ open: true, busy: true, message: 'Transaction sent. Saving EVM tx hash to backend...', success: '', error: '' })
      await submitAndTrackEvmTx(pending, { showMessages: true })
      setProcessModal({ open: true, busy: false, message: '', success: `MOON tx hash saved. Backend worker will confirm from chain: ${txHash}`, error: '' })

      setAmount('')
      await loadSnapshotAllowance(evm.address)
      await loadWalletBalance()
      onRefresh?.()

      // Optional background wait/refresh only. Backend worker remains source of truth.
      meta.provider.waitForTransaction(txHash, 1).then(async () => {
        setSuccess(`MOON transfer mined. Backend worker will mark confirmed shortly: ${txHash}`)
        await loadSnapshotAllowance(evm.address)
        await loadWalletBalance()
        onRefresh?.()
      }).catch(() => {
        setSuccess(`MOON tx hash saved. Backend worker will confirm it from chain: ${txHash}`)
      })
    } catch (err) {
      const msg = err?.message || String(err)
      if (createdDepositId && !txHashSubmitted) {
        if (isUserRejectedWalletError(err)) {
          try {
            await depositApi.evmVoid(createdDepositId, 'user cancelled wallet confirmation before tx submission')
            removeActiveIntent(createdDepositId)
            await loadSnapshotAllowance(evm.address)
            onRefresh?.()
          } catch {
            // Do not hide the original wallet error if cleanup fails.
          }
        } else {
          // Do not auto-void non-rejection errors. Some wallets/RPCs can throw after broadcasting.
          // Leaving the intent keeps backend recovery possible, while allowance math ignores plain intents.
          setSuccess('Wallet/RPC returned an error before the app received a tx hash. If the wallet actually sent the tx, backend recovery can still match the intent.')
        }
      }
      setError(msg)
      setProcessModal({ open: true, busy: false, message: '', success: '', error: msg })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Section title="BSC MOON deposit" subtitle="Only moonboy / MOON on BSC is accepted. Your deposit cannot exceed the MOON snapshot balance for the source wallet.">
      <StatusAlert error={error} success={success} />
      {lastTxHash ? (
        <Alert severity="success">
          <Typography fontWeight={900}>Latest BSC transaction hash saved</Typography>
          <Typography sx={{ wordBreak: 'break-all' }}>
            <Link href={bscTxUrl(lastTxHash)} target="_blank" rel="noreferrer">{lastTxHash}</Link>
          </Typography>
        </Alert>
      ) : null}
      {pendingSubmissions.length ? (
        <Alert severity="warning">
          <Typography fontWeight={900}>Saved EVM tx hash waiting for backend submit/confirmation</Typography>
          {pendingSubmissions.map((p) => (
            <Typography key={`${p.depositId}:${p.txHash}`} sx={{ wordBreak: 'break-all' }}>
              {p.amountUi} {p.tokenSymbol || 'MOON'} — <Link href={bscTxUrl(p.txHash)} target="_blank" rel="noreferrer">{p.txHash}</Link>
            </Typography>
          ))}
          <Button size="small" onClick={() => retryPendingSubmissions({ quiet: false })} disabled={busy}>Retry backend submit</Button>
        </Alert>
      ) : null}
      {activeIntents.length ? (
        <Alert severity="info">
          <Typography fontWeight={900}>Wallet request in progress / waiting for tx hash</Typography>
          {activeIntents.map((p) => (
            <Typography key={p.depositId} sx={{ wordBreak: 'break-all' }}>
              {p.amountUi} {p.tokenSymbol || 'MOON'} — intent {p.depositId}
            </Typography>
          ))}
          <Typography variant="caption">If you cancelled the wallet popup, refresh status; if a tx was sent, the backend can recover it.</Typography>
        </Alert>
      ) : null}

      <Stack spacing={2}>
        <Box className="chip-wrap" sx={{ mt: 2 }}>
          <Chip label={`Token: ${token.name || 'moonboy'} / ${token.symbol || 'MOON'}`} color="primary" />

          <Chip label={`Contract: ${shortAddress(token.tokenContract)}`} />
        </Box>
        <AllowanceCard allowance={allowance} walletAddress={evm.address} />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <TextField fullWidth label="MOON amount" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
          <Button variant="outlined" onClick={setMaxAmount} disabled={busy || !evm.address || allowanceBusy}>Max</Button>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          Connected wallet MOON balance: {walletBalance || (evm.address ? 'not loaded' : 'connect wallet')}
        </Typography>
        <Button variant="contained" onClick={handlePrimaryAction} disabled={busy || Boolean(cannotDepositBySnapshot)}>
          {busy ? 'Depositing MOON...' : (!evm.address ? 'Connect BSC wallet to deposit MOON' : 'Deposit MOON on BSC')}
        </Button>
      </Stack>
      <ProcessingModal
        open={processModal.open}
        title="MOON deposit"
        busy={processModal.busy}
        message={processModal.message}
        success={processModal.success}
        error={processModal.error}
        onClose={() => setProcessModal((prev) => ({ ...prev, open: false }))}
      />
    </Section>
  )
}
