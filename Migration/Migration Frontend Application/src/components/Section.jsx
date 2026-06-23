import { Card, CardContent, Stack, Typography } from '@mui/material'

export function Section({ title, subtitle, children }) {
  return (
    <Card elevation={0} className="app-section">
      <CardContent>
        <Stack spacing={1.1}>
          <Stack spacing={0.2}>
            <Typography variant="h6" fontWeight={900} className="section-title">{title}</Typography>
            {subtitle ? <Typography variant="body2" color="text.secondary" className="section-subtitle">{subtitle}</Typography> : null}
          </Stack>
          {children}
        </Stack>
      </CardContent>
    </Card>
  )
}
