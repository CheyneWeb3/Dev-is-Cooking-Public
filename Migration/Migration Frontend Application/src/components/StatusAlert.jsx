import { Alert, Collapse } from '@mui/material'

export function StatusAlert({ error, success, info }) {
  const message = error || success || info
  const severity = error ? 'error' : success ? 'success' : 'info'
  return (
    <Collapse in={Boolean(message)}>
      {message ? <Alert severity={severity}>{String(message)}</Alert> : null}
    </Collapse>
  )
}
