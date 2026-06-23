import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Link, Paper, Stack, TextField, Typography } from '@mui/material'
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react'
import { useAppKitConnection } from '@reown/appkit-adapter-solana/react'
import { PublicKey, Transaction } from '@solana/web3.js'
import { createAssociatedTokenAccountInstruction, createTransferCheckedInstruction, getAccount, getAssociatedTokenAddressSync, getMint, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { accountApi, depositApi, publicApi } from '../api/client.js'
import { SOLANA_DEPOSIT_ADDRESS } from '../config/env.js'
import { FALLBACK_DEPOSIT_TOKENS, shortAddress } from '../config/depositTokens.js'
import { Section } from '../components/Section.jsx'
import { StatusAlert } from '../components/StatusAlert.jsx'
import { ProcessingModal } from '../components/ProcessingModal.jsx'
import { normalizeSolanaAddress } from '../wallet/solanaAddress.js'

function formatTokenUnits(amountBaseUnits, decimals) {
  const value = BigInt(amountBaseUnits || 0)
  const divisor = 10n ** BigInt(decimals || 0)
  const whole = value / divisor
  const fraction = value % divisor
  if (!decimals) return whole.toString()
  const fractionStr = fraction.toString().padStart(decimals, '0').replace(/0+$/, '')
  return fractionStr ? `${whole.toString()}.${fractionStr}` : whole.toString()
}

function parseTokenUnits(amountUi, decimals) {
  const raw = String(amountUi || '').trim()
  if (!raw || Number(raw) <= 0) throw new Error('Amount must be greater than zero')
  const [wholeRaw, fracRaw = ''] = raw.split('.')
  if (!/^\d*$/.test(wholeRaw) || !/^\d*$/.test(fracRaw)) throw new Error('Invalid amount')
  const whole = wholeRaw || '0'
  const frac = fracRaw.padEnd(decimals, '0').slice(0, decimals)
  const combined = `${whole}${frac}`.replace(/^0+/, '') || '0'
  if (!/^\d+$/.test(combined)) throw new Error('Invalid amount')
  return combined
}

function toBigIntSafe(value) {
  try { return BigInt(value || '0') } catch { return 0n }
}

function validateSolanaAddress(value) {
  try {
    return new PublicKey(String(value || '').trim()).toBase58()
  } catch {
    throw new Error('Enter a valid Coinbase Solana wallet address')
  }
}


function DexWalletModal({ open, onClose, onRefresh }) {
  const [sourceWallet, setSourceWallet] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [linked, setLinked] = useState(null)

  async function submitDexWallet() {
    setBusy(true)
    setError('')
    setLinked(null)
    try {
      const solAddress = validateSolanaAddress(sourceWallet)
      await accountApi.linkWallet({ chain: 'solana', address: solAddress, primary: false })

      setSourceWallet(solAddress)
      setLinked({ solAddress })
      onRefresh?.()
    } catch (err) {
      setError(err?.message || 'Could not link Coinbase Solana wallet')
    } finally {
      setBusy(false)
    }
  }

  function closeAndReset() {
    if (!busy) onClose?.()
  }

  return (
    <Dialog open={open} onClose={closeAndReset} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle>Coinbase Solana wallet</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ pt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            Use this if Coinbase Wallet cannot connect Solana in the app. Link the Solana source wallet from the snapshot. Your BSC/EVM claim address stays set on the Registration page.
          </Typography>

          <TextField
            label="Coinbase Solana source wallet"
            value={sourceWallet}
            onChange={(e) => setSourceWallet(e.target.value)}
            placeholder="Paste Solana address"
            fullWidth
          />

          {error ? <Alert severity="error">{error}</Alert> : null}

          {linked ? (
            <Alert severity="success">
              <Stack spacing={0.75}>
                <Typography fontWeight={800}>Wallet linked. Send SVM only to:</Typography>
                <Typography className="break-text" fontWeight={900}>{SOLANA_DEPOSIT_ADDRESS}</Typography>
                <Typography variant="body2">After sending, paste the Solana transaction signature in Telegram using /linkdexwallet, or use the normal app status refresh once confirmed.</Typography>
                <Typography variant="body2">Claim address is managed on the Registration page.</Typography>
                <Typography variant="caption" className="break-text">Source: {linked.solAddress}</Typography>
              </Stack>
            </Alert>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={closeAndReset} disabled={busy}>Close</Button>
        <Button variant="contained" onClick={submitDexWallet} disabled={busy}>
          {busy ? 'Linking...' : 'Link wallet'}
        </Button>
      </DialogActions>
    </Dialog>
  )
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

function AllowanceCard({ allowance, walletAddress }) {
  if (!walletAddress) return null
  if (!allowance) {
    return (
      <Alert severity="info">Connect wallet and load allowance before depositing. The deposit cap comes from the SVM holder snapshot.</Alert>
    )
  }
  if (!allowance.found) {
    return (
      <Alert severity="warning">This Solana wallet was not found in the SVM snapshot, so it cannot deposit SVM for this migration.</Alert>
    )
  }
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>

    </Paper>
  )
}

export function SolanaDepositPage({ onRefresh }) {
  const { open } = useAppKit()
  const sol = useAppKitAccount({ namespace: 'solana' })
  const { walletProvider } = useAppKitProvider('solana')
  const { connection } = useAppKitConnection()
  const solAddress = useMemo(
    () => normalizeSolanaAddress({ address: sol.address, caipAddress: sol.caipAddress }),
    [sol.address, sol.caipAddress]
  )
  const [token, setToken] = useState(FALLBACK_DEPOSIT_TOKENS.solana)
  const [decimals, setDecimals] = useState(null)
  const [amount, setAmount] = useState('')
  const [walletBalance, setWalletBalance] = useState('')
  const [allowance, setAllowance] = useState(null)
  const [allowanceBusy, setAllowanceBusy] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [processModal, setProcessModal] = useState({ open: false, busy: false, message: '', success: '', error: '' })
  const [dexModalOpen, setDexModalOpen] = useState(false)

  const remainingBaseUnits = useMemo(() => toBigIntSafe(allowance?.remainingBaseUnits), [allowance])
  const cannotDepositBySnapshot = solAddress && allowance && (!allowance.found || remainingBaseUnits <= 0n)

  useEffect(() => {
    async function loadAllowedToken() {
      try {
        const res = await publicApi.depositTokens()
        if (res?.tokens?.solana?.mint) setToken(res.tokens.solana)
      } catch {
        setToken(FALLBACK_DEPOSIT_TOKENS.solana)
      }
    }
    loadAllowedToken()
  }, [])

  useEffect(() => {
    if (solAddress && connection && token?.mint) {
      loadWalletBalance()
      loadSnapshotAllowance(solAddress)
    } else {
      setAllowance(null)
    }
  }, [solAddress, connection, token?.mint])

  async function readMintInfo(mintPk) {
    const accountInfo = await connection.getAccountInfo(mintPk, 'confirmed')
    if (!accountInfo) throw new Error('SVM mint account was not found')

    const programId = accountInfo.owner.equals(TOKEN_2022_PROGRAM_ID) ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID
    const mintInfo = await getMint(connection, mintPk, 'confirmed', programId)
    const dec = Number(mintInfo.decimals)
    if (!Number.isInteger(dec) || dec < 0 || dec > 18) throw new Error('SVM mint decimals could not be read correctly')
    setDecimals(dec)
    return { decimals: dec, programId }
  }

  async function getOwnerTokenAccounts(owner, mintPk, mintInfo) {
    const mint = mintPk.toBase58()
    const res = await connection.getParsedTokenAccountsByOwner(
      owner,
      { programId: mintInfo.programId },
      'confirmed'
    )

    return res.value
      .map((item) => {
        const info = item?.account?.data?.parsed?.info
        const amount = info?.tokenAmount?.amount || '0'
        return {
          pubkey: item.pubkey,
          mint: info?.mint,
          amount: toBigIntSafe(amount)
        }
      })
      .filter((x) => x.mint === mint && x.amount > 0n)
  }

  async function loadSnapshotAllowance(address = solAddress) {
    setAllowanceBusy(true)
    try {
      if (!address) return null
      const res = await accountApi.snapshotAllowance({
        chain: 'solana',
        network: 'solana-mainnet',
        walletAddress: address,
        token: token.symbol || 'SVM',
        tokenMintOrContract: token.mint
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
      if (!solAddress) throw new Error('Connect Solana wallet first')
      if (!connection) throw new Error('Solana connection not available')
      const owner = new PublicKey(solAddress)
      const mintPk = new PublicKey(token.mint)
      const mintInfo = await readMintInfo(mintPk)
      const tokenAccounts = await getOwnerTokenAccounts(owner, mintPk, mintInfo)
      const total = tokenAccounts.reduce((sum, account) => sum + account.amount, 0n)
      const formatted = formatTokenUnits(total.toString(), mintInfo.decimals)
      setWalletBalance(formatted)
      return formatted
    } catch (err) {
      setError(err.message || 'Could not read SVM balance')
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

  function connectSolanaWallet() {
    open({ view: 'Connect', namespace: 'solana' })
  }

  async function handlePrimaryAction() {
    if (!solAddress || !walletProvider) {
      connectSolanaWallet()
      return
    }
    await deposit()
  }

  async function deposit() {
    let createdDepositId = ""
    let signatureSubmitted = false
    setBusy(true)
    setError('')
    setSuccess('')
    setProcessModal({ open: true, busy: true, message: 'Preparing SVM deposit...', success: '', error: '' })
    try {
      if (!solAddress) throw new Error('Connect Solana wallet first')
      if (!walletProvider) throw new Error('Solana wallet provider not available')
      if (!connection) throw new Error('Solana connection not available')
      if (!amount || Number(amount) <= 0) throw new Error('Amount must be greater than zero')

      const owner = new PublicKey(solAddress)
      const mintPk = new PublicKey(token.mint)
      const mintInfo = await readMintInfo(mintPk)
      const dec = mintInfo.decimals
      const tokenProgramId = mintInfo.programId
      const currentAllowance = allowance || await loadSnapshotAllowance(owner.toBase58())
      if (!currentAllowance?.found) throw new Error('This Solana wallet is not in the SVM snapshot')
      const amountBaseUnits = parseTokenUnits(amount, dec)
      if (BigInt(amountBaseUnits) <= 0n) throw new Error('Amount must be greater than zero')
      if (toBigIntSafe(amountBaseUnits) > toBigIntSafe(currentAllowance.remainingBaseUnits)) {
        throw new Error(`Amount exceeds snapshot allowance. Remaining: ${currentAllowance.remainingUi} SVM`)
      }

      await accountApi.linkWallet({ chain: 'solana', address: owner.toBase58(), primary: false })

      const intent = await depositApi.solanaIntent({
        walletAddress: owner.toBase58(),
        mint: mintPk.toBase58(),
        tokenSymbol: token.symbol,
        decimals: dec,
        amountUi: amount,
        amountBaseUnits
      })

      createdDepositId = intent.depositId || intent.id || intent._id || ""
      const destinationWallet = new PublicKey(intent.destinationWallet)
      const destAta = getAssociatedTokenAddressSync(mintPk, destinationWallet, false, tokenProgramId)
      const tx = new Transaction()

      const destInfo = await connection.getAccountInfo(destAta)
      if (!destInfo) {
        tx.add(createAssociatedTokenAccountInstruction(owner, destAta, destinationWallet, mintPk, tokenProgramId))
      }

      const sourceAccounts = await getOwnerTokenAccounts(owner, mintPk, mintInfo)
      let remainingToSend = BigInt(amountBaseUnits)

      for (const source of sourceAccounts) {
        if (remainingToSend <= 0n) break
        const sendAmount = source.amount >= remainingToSend ? remainingToSend : source.amount
        if (sendAmount > 0n) {
          tx.add(createTransferCheckedInstruction(source.pubkey, mintPk, destAta, owner, sendAmount, dec, [], tokenProgramId))
          remainingToSend -= sendAmount
        }
      }

      if (remainingToSend > 0n) {
        throw new Error('Connected wallet does not have enough SVM available in token accounts')
      }

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
      tx.feePayer = owner
      tx.recentBlockhash = blockhash

      setProcessModal({ open: true, busy: true, message: 'Confirm the SVM transfer in your Solana wallet.', success: '', error: '' })
      let signature = ''

      if (typeof walletProvider.sendTransaction === 'function') {
        const sent = await walletProvider.sendTransaction(tx, connection)
        signature = typeof sent === 'string' ? sent : sent?.signature || ''
      } else {
        const signed = await walletProvider.signTransaction(tx)
        signature = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: false })
      }

      if (!signature) throw new Error('Wallet did not return a Solana transaction signature')

      // Critical: once the wallet/RPC returns a signature, record it with the backend immediately.
      // Do not wait for browser-side confirmTransaction first, because Solana can finalize the tx
      // while the local confirmation call still throws "block height exceeded".
      signatureSubmitted = true
      setProcessModal({ open: true, busy: true, message: 'Transaction sent. Recording Solana signature with backend...', success: '', error: '' })
      await depositApi.solanaSubmit(intent.depositId, signature)
      setSuccess(`SVM transaction sent and recorded. Confirming on-chain: ${signature}`)

      try {
        await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed')
        setSuccess(`SVM deposit submitted and recorded: ${signature}`)
      } catch (confirmErr) {
        const msg = confirmErr?.message || String(confirmErr)
        // This is not proof of failure. The backend worker/repair flow confirms from finalized chain state.
        if (/block height exceeded|expired/i.test(msg)) {
          setSuccess(`SVM transaction was sent and recorded. Final confirmation is still being checked on-chain: ${signature}`)
        } else {
          setSuccess(`SVM transaction was sent and recorded. Confirmation is pending on-chain: ${signature}`)
        }
      }

      setProcessModal({ open: true, busy: false, message: '', success: `SVM deposit recorded. Backend worker will confirm from chain: ${signature}`, error: '' })
      await loadSnapshotAllowance(owner.toBase58())
      await loadWalletBalance()
      onRefresh?.()
    } catch (err) {
      const msg = err?.message || String(err)
      if (createdDepositId && !signatureSubmitted) {
        try {
          await depositApi.solanaVoid(createdDepositId, /reject|denied|cancel|user/i.test(msg)
            ? 'user cancelled wallet confirmation before signature submission'
            : `wallet transaction failed before signature submission: ${msg.slice(0, 180)}`)
          await loadSnapshotAllowance(solAddress)
          onRefresh?.()
        } catch {
          // Keep the original wallet error visible.
        }
      }
      setError(msg)
      setProcessModal({ open: true, busy: false, message: '', success: '', error: msg })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Section title="Solana SVM deposit" subtitle="Only SaveMoon / SVM on Solana is accepted. Your deposit cannot exceed the SVM snapshot balance for the source wallet.">
    
      <Stack spacing={2}>
        <Box sx={{ mt: 1 }}>
          <Link
            component="button"
            type="button"
            underline="hover"
            onClick={() => setDexModalOpen(true)}
            sx={{ color: 'primary.main', fontWeight: 800, textAlign: 'left' }}
          >
            Have a Coinbase Solana wallet that is in the snapshot?
          </Link>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
            Link it manually and get the Solana deposit address.
          </Typography>
        </Box>

        <Box className="chip-wrap" sx={{ mt: 1 }}>
          <Chip label={`Token: ${token.name || 'SaveMoon'} / ${token.symbol || 'SVM'}`} color="primary" />

          <Chip label={`Mint: ${shortAddress(token.mint)}`} />
        </Box>
        <AllowanceCard allowance={allowance} walletAddress={solAddress} />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <TextField fullWidth label="SVM amount" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
          <Button variant="outlined" onClick={setMaxAmount} disabled={busy || !solAddress || allowanceBusy}>Max</Button>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          Connected wallet SVM balance: {walletBalance || (solAddress ? 'not loaded' : 'connect wallet')}
        </Typography>
        <Button variant="contained" onClick={handlePrimaryAction} disabled={busy || Boolean(cannotDepositBySnapshot)}>
          {busy ? 'Depositing SVM...' : (!solAddress ? 'Connect Solana wallet to deposit SVM' : 'Deposit SVM on Solana')}
        </Button>
      </Stack>
      <ProcessingModal
        open={processModal.open}
        title="SVM deposit"
        busy={processModal.busy}
        message={processModal.message}
        success={processModal.success}
        error={processModal.error}
        onClose={() => setProcessModal((prev) => ({ ...prev, open: false }))}
      />
      <DexWalletModal open={dexModalOpen} onClose={() => setDexModalOpen(false)} onRefresh={onRefresh} />
    </Section>
  )
}
