import { useEffect, useMemo, useState } from 'react'
import {
  AppBar,
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Container,
  CssBaseline,
  Paper,
  Stack,
  ThemeProvider,
  Toolbar,
  Typography,
  createTheme
} from '@mui/material'
      import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded'
      import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded'
      import BoltRoundedIcon from '@mui/icons-material/BoltRounded'
      import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
      import QueryStatsRoundedIcon from '@mui/icons-material/QueryStatsRounded'
      import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded'
      import './wallet/appkit.js'
      import { APP_NAME } from './config/env.js'
      import { AccountPanel } from './components/AccountPanel.jsx'
      import { StartPage } from './pages/StartPage.jsx'
      import { StatusPage } from './pages/StatusPage.jsx'
      import { EvmDepositPage } from './pages/EvmDepositPage.jsx'
      import { SolanaDepositPage } from './pages/SolanaDepositPage.jsx'
      import { PublicTotalsPage } from './pages/PublicTotalsPage.jsx'
      import './style.css'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#fb7f3f', contrastText: '#1c0314' },
    secondary: { main: '#ffdcae', contrastText: '#1c0314' },
    success: { main: '#74c043' },
    warning: { main: '#df9226' },
    error: { main: '#ff6357' },
    background: {
      default: '#120610',
      paper: '#2a0e15'
    },
    divider: 'rgba(255, 202, 143, 0.18)',
    text: {
      primary: '#fff4df',
      secondary: 'rgba(255, 244, 223, 0.68)'
    }
  },
  shape: { borderRadius: 13 },
  typography: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
    h6: { letterSpacing: '-0.03em', fontWeight: 900 },
    button: { textTransform: 'none', fontWeight: 900 }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { minHeight: 44, borderRadius: 13 },
        contained: { boxShadow: 'none' }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#2a0e15',
          border: '1px solid rgba(255, 202, 143, 0.20)'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' }
      }
    },
    MuiTextField: {
      defaultProps: { size: 'small' }
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 14, alignItems: 'center' }
      }
    }
  }
})

const tabs = [
  ['start', 'Register', HowToRegRoundedIcon],
  ['bsc', 'BSC', AccountBalanceWalletRoundedIcon],
  ['solana', 'Solana', BoltRoundedIcon],
  ['status', 'Status', ReceiptLongRoundedIcon],
  ['totals', 'Totals', QueryStatsRoundedIcon],
  ['accounts', 'Accounts', AccountCircleRoundedIcon]
]


function TabChefImage({ tab }) {
  const imageByTab = {
                      start: '/1.png',
                      bsc: '/2.png',
                      solana: '/4.png',
                      status: '/3.png',
                      totals: '/5.png',
                      accounts: '/1.png'
  }

  const src = imageByTab[tab] || '/1.png'

  return (
    <Box className={`tab-chef-wrap tab-chef-${tab}`}>
      <Box
        component="img"
        src={src}
        alt=""
        aria-hidden="true"
        className="tab-chef-image"
        draggable={false}
      />
    </Box>
  )
}

export default function App() {
  const [tab, setTab] = useState('start')
  const [refreshKey, setRefreshKey] = useState(0)
  const [accountStatus, setAccountStatus] = useState(null)
  const refresh = () => setRefreshKey((x) => x + 1)
  const activeTab = useMemo(() => tabs.some(([value]) => value === tab) ? tab : 'start', [tab])

  useEffect(() => {
    if (activeTab !== tab) setTab(activeTab)
  }, [activeTab, tab])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className="mobile-shell">
        <AppBar position="sticky" elevation={0} className="mobile-topbar">

        </AppBar>

                  <Container maxWidth="sm" className="mobile-container">
                    <Stack spacing={1.25}>
                      <Box className="screen-card">
                        <AccountPanel
                          refreshKey={refreshKey}
                          onRefresh={refresh}
                          onStatusChange={setAccountStatus}
                          mode={activeTab === 'accounts' ? 'page' : 'hidden'}
                        />
                        {activeTab === 'start' && <StartPage onRefresh={refresh} accountStatus={accountStatus} />}
                        {activeTab === 'bsc' && <EvmDepositPage onRefresh={refresh} />}
                        {activeTab === 'solana' && <SolanaDepositPage onRefresh={refresh} />}
                        {activeTab === 'status' && <StatusPage refreshKey={refreshKey} />}
                        {activeTab === 'totals' && <PublicTotalsPage />}
                        <TabChefImage tab={activeTab} />
                      </Box>
                    </Stack>
                  </Container>

        <Paper elevation={0} className="bottom-nav-wrap">
          <BottomNavigation value={activeTab} onChange={(_, v) => setTab(v)} showLabels className="bottom-nav">
            {tabs.map(([value, label, Icon]) => (
              <BottomNavigationAction key={value} value={value} label={label} icon={<Icon />} />
            ))}
          </BottomNavigation>
        </Paper>
      </Box>
    </ThemeProvider>
  )
}
