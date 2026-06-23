import { useState } from 'react'
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Stack, Typography } from '@mui/material'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import { useAppKit, useAppKitAccount } from '@reown/appkit/react'

function short(address) {
  if (!address) return 'Not connected'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function WalletBar() {
  const { open } = useAppKit()
  const evm = useAppKitAccount({ namespace: 'eip155' })
  const sol = useAppKitAccount({ namespace: 'solana' })
  const [accountOpen, setAccountOpen] = useState(false)
  const anyConnected = Boolean(evm.isConnected || sol.isConnected)

  function openAppKit(namespace) {
    setAccountOpen(false)
    open({ view: anyConnected ? 'Account' : 'Connect', namespace })
  }

  return (
    <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
        <Stack spacing={0.25}>
          <Typography variant="subtitle2" fontWeight={800}>Account</Typography>
          <Typography variant="caption" color="text.secondary">
            {anyConnected ? 'Wallet connected. Open account to view/manage wallets.' : 'Connect a wallet to link it to your Telegram session.'}
          </Typography>
        </Stack>

        {anyConnected ? (
          <Button startIcon={<AccountBalanceWalletIcon />} variant="contained" onClick={() => setAccountOpen(true)}>
            Account / wallets
          </Button>
        ) : (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button variant="contained" onClick={() => open({ view: 'Connect', namespace: 'eip155' })}>Connect BSC</Button>
            <Button variant="outlined" onClick={() => open({ view: 'Connect', namespace: 'solana' })}>Connect Solana</Button>
          </Stack>
        )}
      </Stack>

      <Dialog open={accountOpen} onClose={() => setAccountOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Connected wallet account</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              These are browser wallet connections. The registration panel below links them to the Telegram-backed backend account.
            </Typography>
            <Box className="chip-wrap" sx={{ mt: 1 }}>
              <Chip label={`BSC/EVM: ${short(evm.address)}`} color={evm.isConnected ? 'success' : 'default'} />
              <Chip label={`Solana: ${short(sol.address)}`} color={sol.isConnected ? 'success' : 'default'} />
            </Box>
            <Divider />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button variant="contained" onClick={() => openAppKit('eip155')}>{evm.isConnected ? 'Open EVM account' : 'Connect BSC'}</Button>
              <Button variant="outlined" onClick={() => openAppKit('solana')}>{sol.isConnected ? 'Open Solana account' : 'Connect Solana'}</Button>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAccountOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
