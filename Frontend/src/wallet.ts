import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { polygon } from 'wagmi/chains'

const walletConnectProjectId =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ?? 'tokenized-sprx-demo'

export const targetChainId = import.meta.env.VITE_APP_CHAIN_ID
  ? Number(import.meta.env.VITE_APP_CHAIN_ID)
  : polygon.id

export const wagmiConfig = getDefaultConfig({
  appName: 'Tokenized SPRX',
  projectId: walletConnectProjectId,
  chains: [polygon],
  ssr: false,
})
