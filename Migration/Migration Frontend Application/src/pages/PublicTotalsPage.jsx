import { useEffect, useState } from 'react'
import { Box, Button, Stack, Typography } from '@mui/material'
import { publicApi } from '../api/client.js'
import { Section } from '../components/Section.jsx'
import { StatusAlert } from '../components/StatusAlert.jsx'

function shortAddress(address = '') {
  if (!address) return '-'
  if (address.length <= 16) return address
  return `${address.slice(0, 8)}...${address.slice(-6)}`
}

export function PublicTotalsPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    setBusy(true)
    setError('')
    try {
      const totalsRes = await publicApi.tokenTotals()
      setData(totalsRes)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <Section title="Totals" subtitle="Public confirmed totals for accepted migration tokens.">
      <StatusAlert error={error} />
      <Button variant="outlined" onClick={load} disabled={busy}>{busy ? 'Refreshing...' : 'Refresh totals'}</Button>
      {data?.generatedAt ? <Typography variant="caption" color="text.secondary">Updated {new Date(data.generatedAt).toLocaleString()}</Typography> : null}
      <Stack spacing={0.8}>
        {(data?.totals || []).map((row, i) => (
          <Box className="deposit-row-card" key={`${row.chain}-${row.network}-${row.token}-${i}`}>
            <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="flex-start">
              <Box sx={{ minWidth: 0 }}>
                <Typography fontWeight={900}>{row.symbol || 'Token'} · {row.chain}</Typography>
                <Typography variant="caption" color="text.secondary">{row.network || '-'} · {shortAddress(row.token)}</Typography>
              </Box>
              <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                <Typography fontWeight={900}>{row.amountUi || '0'}</Typography>
                <Typography variant="caption" color="text.secondary">{row.depositCount || 0} deposits</Typography>
              </Box>
            </Stack>
          </Box>
        ))}
        {(!data?.totals || data.totals.length === 0) ? <Typography color="text.secondary">No confirmed public totals yet.</Typography> : null}
      </Stack>
    </Section>
  )
}
