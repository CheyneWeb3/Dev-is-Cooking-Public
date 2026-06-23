import { useEffect } from 'react'
import {
  Alert,
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography
} from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'

export function ProcessingModal({
  open,
  title = 'Processing',
  message = '',
  busy = false,
  success = '',
  error = '',
  onClose,
  autoCloseMs = 3000
}) {
  useEffect(() => {
    if (!open || !success || busy) return undefined
    const timer = window.setTimeout(() => onClose?.(), autoCloseMs)
    return () => window.clearTimeout(timer)
  }, [open, success, busy, autoCloseMs, onClose])

  const isSuccess = Boolean(success && !busy)
  const isError = Boolean(error && !busy)

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pr: 6 }}>
        {title}
        <IconButton
          aria-label="Close processing window"
          onClick={onClose}
          size="small"
          sx={{ position: 'absolute', right: 10, top: 10 }}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} alignItems="center" sx={{ textAlign: 'center', py: 1 }}>
          {busy ? <CircularProgress size={42} /> : null}
          {isSuccess ? <CheckCircleRoundedIcon color="success" sx={{ fontSize: 46 }} /> : null}
          {isError ? <Alert severity="error" sx={{ width: '100%', textAlign: 'left' }}>{error}</Alert> : null}

          <Box>
            <Typography fontWeight={900}>
              {busy ? 'Waiting for confirmation' : isSuccess ? 'Success' : isError ? 'Action failed' : 'Ready'}
            </Typography>
            <Typography variant="body2" color="text.secondary" className="break-text" sx={{ mt: 0.5 }}>
              {success || error || message || 'Please continue in your wallet if a wallet popup is open.'}
            </Typography>
          </Box>

          {isSuccess ? (
            <Typography variant="caption" color="text.secondary">
              This window will close automatically in 3 seconds.
            </Typography>
          ) : null}
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
