import { createAppKit } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { SolanaAdapter } from '@reown/appkit-adapter-solana'
import { bsc, solana } from '@reown/appkit/networks'
import { APP_NAME, APP_URL, REOWN_PROJECT_ID } from '../config/env.js'

export const networks = [bsc, solana]
export const ethersAdapter = new EthersAdapter()
export const solanaAdapter = new SolanaAdapter()

const metadata = {
  name: APP_NAME,
  description: 'Token migration claim and deposit app',
  url: APP_URL,
  icons: [`${APP_URL}/icon.png`]
}

export const appKit = createAppKit({
  adapters: [ethersAdapter, solanaAdapter],
  networks,
  metadata,
  projectId: REOWN_PROJECT_ID,
  features: {
    analytics: false,
    email: false,
    socials: false
  }
})
