import { useCallback, useEffect, useMemo, useState } from 'react'
import { ethers } from 'ethers'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import {
  Activity,
  ArrowRightLeft,
  CircleCheckBig,
  CircleX,
  Coins,
  Landmark,
  Play,
  Ticket,
  Wallet,
  Zap,
} from 'lucide-react'
import './App.css'
import { targetChainId } from './wallet.ts'

/* ─── Types ─────────────────────────────────────────── */
type EventItem = {
  id: number
  title: string
  venue: string
  startTime: string
  streamType: string
  description: string
  ticketPrice: string
  pricePerMinute: string
}

type AccessInput = { minutes: string; amount: string }
type Tab = 'events' | 'exchange'

/* ─── Env ───────────────────────────────────────────── */
const backendUrl =
  import.meta.env.VITE_APP_BACKEND_URL ?? 'http://localhost:5000'
const ticketAddress = import.meta.env.VITE_APP_TICKET_ADDRESS ?? ''
const tokenAddress = import.meta.env.VITE_APP_TOKEN_ADDRESS ?? ''
const accessAddress = import.meta.env.VITE_APP_ACCESS_ADDRESS ?? ''
const stablecoinAddress = import.meta.env.VITE_APP_STABLECOIN_ADDRESS ?? ''

/* ─── ABIs ──────────────────────────────────────────── */
const ticketAbi = [
  'function hasRole(bytes32 role,address account) view returns (bool)',
  'function mintTicket(address to,uint256 eventId,uint8 accessLevel,string seat,string uri) returns (uint256)',
  'function hasTicketForEvent(address owner,uint256 eventId) view returns (bool)',
]

const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000'

const tokenAbi = [
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner,address spender) view returns (uint256)',
  'function approve(address spender,uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
]

const accessAbi = [
  'function burnForAccess(uint256 eventId,uint256 accessMinutes,uint256 burnAmount)',
  'function payStableForAccess(uint256 eventId,uint256 accessMinutes)',
  'function buyTokens(uint256 stableAmount)',
  'function sellTokens(uint256 sprxAmount)',
  'function hasAccess(address user,uint256 eventId) view returns (bool)',
  'function accessGrants(address user,uint256 eventId) view returns (uint64 accessUntil,uint256 totalBurned,uint256 totalStablePaid)',
  'function sprxPerStable() view returns (uint256)',
  'function stableCostPerMinute() view returns (uint256)',
  'function feeBps() view returns (uint256)',
]

const erc20Abi = [
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address,address) view returns (uint256)',
  'function approve(address,uint256) returns (bool)',
  'function decimals() view returns (uint8)',
]

/* ─── Sport image helper ─────────────────────────────── */
const SPORT_IMAGES: Record<string, string> = {
  soccer:     'photo-1508098682722-e99c43a406b2',
  football:   'photo-1508098682722-e99c43a406b2',
  basketball: 'photo-1546519638-68e109498ffc',
  baseball:   'photo-1531415074968-036ba1b575da',
  tennis:     'photo-1554068865-24cecd4e34b8',
  golf:       'photo-1535131749006-b7f58c99034b',
  racing:     'photo-1558618666-fcd25c85cd64',
  formula:    'photo-1558618666-fcd25c85cd64',
  esport:     'photo-1542751371-adc38448a05e',
  gaming:     'photo-1542751371-adc38448a05e',
  cricket:    'photo-1540747913346-19212a729f3c',
  default:    'photo-1461896836934-ffe607ba8211',
}

function getEventImage(streamType: string): string {
  const lower = streamType.toLowerCase()
  for (const [key, id] of Object.entries(SPORT_IMAGES)) {
    if (key !== 'default' && lower.includes(key)) {
      return `https://images.unsplash.com/${id}?w=600&h=200&fit=crop&q=80`
    }
  }
  return `https://images.unsplash.com/${SPORT_IMAGES.default}?w=600&h=200&fit=crop&q=80`
}

/* ═══════════════════════════════════════════════════════ */

function App() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChainAsync } = useSwitchChain()

  const [events, setEvents] = useState<EventItem[]>([])
  const [tokenBalance, setTokenBalance] = useState('0')
  const [stableBalance, setStableBalance] = useState('0')
  const [tokenDecimals, setTokenDecimals] = useState(18)
  const [isOwner, setIsOwner] = useState(false)
  const [status, setStatus] = useState('')
  const [accessMap, setAccessMap] = useState<Record<number, boolean>>({})
  const [grantMap, setGrantMap] = useState<Record<number, string>>({})
  const [inputs, setInputs] = useState<Record<number, AccessInput>>({})
  const [tab, setTab] = useState<Tab>('events')

  // Exchange state
  const [exchangeAmount, setExchangeAmount] = useState('')
  const [exchangeRate, setExchangeRate] = useState('0')
  const [exchangeMode, setExchangeMode] = useState<'buy' | 'sell'>('buy')

  const isWrongNetwork = useMemo(
    () => isConnected && chainId !== targetChainId,
    [chainId, isConnected],
  )

  /* ─── Load events ─────────────────────────────────── */
  useEffect(() => {
    fetch(`${backendUrl}/api/events`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed')
        return r.json()
      })
      .then((p) => setEvents(p.events ?? []))
      .catch(console.error)
  }, [])

  /* ─── Helpers ─────────────────────────────────────── */
  const getProvider = () => {
    const ethereum = window.ethereum as ethers.Eip1193Provider | undefined
    if (!ethereum) throw new Error('Wallet not found')
    return new ethers.BrowserProvider(ethereum)
  }

  const getContracts = (sp: ethers.Signer | ethers.Provider) => ({
    ticket: new ethers.Contract(ticketAddress, ticketAbi, sp),
    token: new ethers.Contract(tokenAddress, tokenAbi, sp),
    access: new ethers.Contract(accessAddress, accessAbi, sp),
    stable: stablecoinAddress
      ? new ethers.Contract(stablecoinAddress, erc20Abi, sp)
      : null,
  })

  const requestPolygonSwitch = async () => {
    if (!window.ethereum) {
      setStatus('MetaMask not detected.')
      return
    }
    try {
      await switchChainAsync({ chainId: targetChainId })
      setStatus('Switched to Polygon.')
    } catch {
      const ethereum = window.ethereum as ethers.Eip1193Provider
      try {
        await ethereum.request?.({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0x89',
              chainName: 'Polygon Mainnet',
              nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
              rpcUrls: ['https://polygon-rpc.com'],
              blockExplorerUrls: ['https://polygonscan.com'],
            },
          ],
        })
      } catch {
        setStatus('Failed to switch network.')
      }
    }
  }

  /* ─── Refresh data ────────────────────────────────── */
  const refreshAccountData = useCallback(async () => {
    if (!isConnected || !address) {
      setTokenBalance('0')
      setStableBalance('0')
      setIsOwner(false)
      setAccessMap({})
      setGrantMap({})
      return
    }

    // If contracts aren't deployed/configured yet, show zeros without error
    if (!tokenAddress && !ticketAddress && !accessAddress) {
      setTokenBalance('0')
      setStableBalance('0')
      return
    }

    let provider: ethers.BrowserProvider
    try {
      provider = getProvider()
    } catch {
      return // no wallet, stay silent
    }

    const { ticket, token, access, stable } = getContracts(provider)

    // SPRX balance
    try {
      const [balance, decimals] = await Promise.all([
        token.balanceOf(address),
        token.decimals(),
      ])
      const dec = Number(decimals)
      setTokenDecimals(dec)
      setTokenBalance(ethers.formatUnits(balance, dec))
    } catch {
      setTokenBalance('0')
    }

    // Admin role
    try {
      const isAdmin = await ticket.hasRole(DEFAULT_ADMIN_ROLE, address)
      setIsOwner(isAdmin)
    } catch {
      setIsOwner(false)
    }

    // USDC / stablecoin balance
    if (stable) {
      try {
        const [sd, sb] = await Promise.all([stable.decimals(), stable.balanceOf(address)])
        setStableBalance(ethers.formatUnits(sb, sd))
      } catch {
        setStableBalance('0')
      }
    }

    // Exchange rate
    try {
      const rate = await access.sprxPerStable()
      setExchangeRate(rate.toString())
    } catch {
      /* rate not available until contract deployed */
    }

    // Per-event access
    const accessStates: Record<number, boolean> = {}
    const grantStates: Record<number, string> = {}
    for (const ev of events) {
      try {
        const has = await access.hasAccess(address, ev.id)
        accessStates[ev.id] = has
        const g = await access.accessGrants(address, ev.id)
        const until = Number(g.accessUntil)
        if (until > 0) grantStates[ev.id] = new Date(until * 1000).toLocaleString()
      } catch {
        accessStates[ev.id] = false
      }
    }
    setAccessMap(accessStates)
    setGrantMap(grantStates)
  }, [address, events, isConnected])

  useEffect(() => {
    void refreshAccountData()
  }, [refreshAccountData])

  /* ─── Allowance helper ────────────────────────────── */
  const ensureAllowance = async (
    tokenContract: ethers.Contract,
    spender: string,
    amount: bigint,
  ) => {
    if (!address) throw new Error('Wallet not connected')
    const allowance = await tokenContract.allowance(address, spender)
    if (allowance >= amount) return
    setStatus('Approving tokens…')
    const tx = await tokenContract.approve(spender, amount)
    await tx.wait()
  }

  /* ─── Mint ticket ─────────────────────────────────── */
  const handleMint = async (eventId: number) => {
    if (!isConnected || isWrongNetwork || !address || !isOwner) {
      setStatus(
        !isConnected
          ? 'Connect wallet first.'
          : isWrongNetwork
            ? 'Switch to Polygon.'
            : !isOwner
              ? 'Only owner can mint.'
              : 'Address unavailable.',
      )
      return
    }
    try {
      const signer = await getProvider().getSigner()
      const { ticket } = getContracts(signer)
      setStatus('Minting ticket…')
      const tx = await ticket.mintTicket(
        address,
        eventId,
        1,
        'VR-Section-A',
        `https://metadata.tokenized-sprx.example/event/${eventId}/ticket.json`,
      )
      await tx.wait()
      setStatus('Ticket minted.')
      await refreshAccountData()
    } catch (e) {
      console.error(e)
      setStatus('Mint failed.')
    }
  }

  /* ─── Burn for access ─────────────────────────────── */
  const handleBurn = async (eventId: number) => {
    if (!isConnected || isWrongNetwork) {
      setStatus(!isConnected ? 'Connect wallet.' : 'Switch to Polygon.')
      return
    }
    const inp = inputs[eventId]
    if (!inp || Number(inp.minutes) <= 0 || Number(inp.amount) <= 0) {
      setStatus('Enter minutes and token amount.')
      return
    }
    try {
      const signer = await getProvider().getSigner()
      const { access, token } = getContracts(signer)
      const amt = ethers.parseUnits(inp.amount, tokenDecimals)
      await ensureAllowance(token, accessAddress, amt)
      setStatus('Burning tokens for access…')
      const tx = await access.burnForAccess(eventId, Number(inp.minutes), amt)
      await tx.wait()
      setStatus('Access granted via burn.')
      await refreshAccountData()
    } catch (e) {
      console.error(e)
      setStatus('Burn failed.')
    }
  }

  /* ─── Pay stablecoin for access ───────────────────── */
  const handlePayStable = async (eventId: number) => {
    if (!isConnected || isWrongNetwork) {
      setStatus(!isConnected ? 'Connect wallet.' : 'Switch to Polygon.')
      return
    }
    const inp = inputs[eventId]
    if (!inp || Number(inp.minutes) <= 0) {
      setStatus('Enter access minutes.')
      return
    }
    try {
      const signer = await getProvider().getSigner()
      const { access, stable } = getContracts(signer)
      if (!stable) {
        setStatus('Stablecoin not configured.')
        return
      }
      // Approve enough stablecoin (generous upper bound)
      const costPerMin = await access.stableCostPerMinute()
      const feeBps = await access.feeBps()
      const totalCost =
        BigInt(inp.minutes) * BigInt(costPerMin)
      const fee = (totalCost * BigInt(feeBps)) / 10000n
      const totalNeeded = totalCost + fee

      await ensureAllowance(stable, accessAddress, totalNeeded)
      setStatus('Paying USDC for access…')
      const tx = await access.payStableForAccess(eventId, Number(inp.minutes))
      await tx.wait()
      setStatus('Access granted via USDC.')
      await refreshAccountData()
    } catch (e) {
      console.error(e)
      setStatus('Stablecoin payment failed.')
    }
  }

  /* ─── Exchange: buy / sell SPRX ───────────────────── */
  const handleExchange = async () => {
    if (!isConnected || isWrongNetwork) {
      setStatus(!isConnected ? 'Connect wallet.' : 'Switch to Polygon.')
      return
    }
    if (!exchangeAmount || Number(exchangeAmount) <= 0) {
      setStatus('Enter an amount.')
      return
    }
    try {
      const signer = await getProvider().getSigner()
      const { access, token, stable } = getContracts(signer)

      if (exchangeMode === 'buy') {
        if (!stable) {
          setStatus('Stablecoin not configured.')
          return
        }
        const stableDecimals = await stable.decimals()
        const amt = ethers.parseUnits(exchangeAmount, stableDecimals)
        await ensureAllowance(stable, accessAddress, amt)
        setStatus('Buying SPRX with USDC…')
        const tx = await access.buyTokens(amt)
        await tx.wait()
        setStatus('SPRX purchased.')
      } else {
        const amt = ethers.parseUnits(exchangeAmount, tokenDecimals)
        await ensureAllowance(token, accessAddress, amt)
        setStatus('Selling SPRX for USDC…')
        const tx = await access.sellTokens(amt)
        await tx.wait()
        setStatus('SPRX sold for USDC.')
      }
      await refreshAccountData()
    } catch (e) {
      console.error(e)
      setStatus('Exchange failed.')
    }
  }

  /* ─── Stream start ────────────────────────────────── */
  const handleStartStream = async (eventId: number) => {
    if (!isConnected || isWrongNetwork || !address) {
      setStatus(!isConnected ? 'Connect wallet.' : 'Switch to Polygon.')
      return
    }
    try {
      const res = await fetch(`${backendUrl}/api/stream/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: address, eventId }),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.message ?? 'Denied.')
      setStatus(`Stream started: ${payload.sessionId}`)
    } catch (e) {
      console.error(e)
      setStatus('Stream start failed.')
    }
  }

  const handleInputChange = (
    eventId: number,
    field: keyof AccessInput,
    value: string,
  ) =>
    setInputs((prev) => ({
      ...prev,
      [eventId]: {
        minutes: prev[eventId]?.minutes ?? '15',
        amount: prev[eventId]?.amount ?? '25',
        [field]: value,
      },
    }))

  /* ─── Computed exchange preview ───────────────────── */
  const exchangePreview = useMemo(() => {
    const n = Number(exchangeAmount)
    if (!n || !Number(exchangeRate)) return null
    const rate = Number(exchangeRate)
    if (exchangeMode === 'buy') return `≈ ${(n * rate).toFixed(2)} SPRX`
    return `≈ ${(n / rate).toFixed(6)} USDC`
  }, [exchangeAmount, exchangeRate, exchangeMode])

  /* ═══════════  RENDER  ═══════════════════════════════ */
  return (
    <div className="app">
      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="nav-brand">
          <Zap size={20} color="var(--accent)" />
          <h2>Tokenized SPRX</h2>
          <span className="nav-badge">EIP-1967</span>
        </div>
        <div className="nav-right">
          {isConnected && (
            <div
              className={`chain-pill ${isWrongNetwork ? 'wrong' : ''}`}
              onClick={isWrongNetwork ? requestPolygonSwitch : undefined}
              style={isWrongNetwork ? { cursor: 'pointer' } : undefined}
            >
              <span className="chain-dot" />
              {isWrongNetwork ? 'Wrong Network' : 'Polygon'}
            </div>
          )}
          <ConnectButton.Custom>
            {({ account, chain, openAccountModal, openConnectModal, mounted }) => {
              const connected = mounted && account && chain
              return (
                <button
                  className="btn-primary btn-sm"
                  onClick={connected ? openAccountModal : openConnectModal}
                >
                  <Wallet size={14} />
                  {connected ? account.displayName : 'Connect'}
                </button>
              )
            }}
          </ConnectButton.Custom>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-text">
          <p className="eyebrow">Polygon &middot; Upgradeable &middot; Stablecoin</p>
          <h1>Stream Access Platform</h1>
          <p className="subtitle">
            Buy stream access with USDC or SPRX tokens. Trade, exchange, and
            transfer on-demand — powered by EIP-1967 upgradeable smart contracts
            on Polygon.
          </p>
        </div>
        <div className="hero-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <Coins size={18} color="var(--accent)" />
            </div>
            <h3>{Number(tokenBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })}</h3>
            <p>SPRX Balance</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Landmark size={18} color="var(--accent-2)" />
            </div>
            <h3>{Number(stableBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })}</h3>
            <p>USDC Balance</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Activity size={18} color="var(--accent-success)" />
            </div>
            <h3>
              {Object.values(accessMap).filter(Boolean).length}/
              {events.length}
            </h3>
            <p>Active Access</p>
          </div>
        </div>
      </section>

      {/* ── Tabs ── */}
      <div className="section-tabs">
        <button
          className={`tab-btn ${tab === 'events' ? 'active' : ''}`}
          onClick={() => setTab('events')}
        >
          <Ticket size={14} /> Live Events
        </button>
        <button
          className={`tab-btn ${tab === 'exchange' ? 'active' : ''}`}
          onClick={() => setTab('exchange')}
        >
          <ArrowRightLeft size={14} /> Token Exchange
        </button>
      </div>

      {/* ─────────── EVENTS TAB ─────────── */}
      {tab === 'events' && (
        <section className="events">
          <div className="event-grid">
            {events.map((ev) => {
              const inp = inputs[ev.id] ?? {
                minutes: '15',
                amount: ev.pricePerMinute,
              }
              return (
                <article key={ev.id} className="event-card">
                  {/* Sport thumbnail */}
                  <div
                    className="event-thumb"
                    style={{ backgroundImage: `url('${getEventImage(ev.streamType)}')` }}
                  >
                    <div className="thumb-badges">
                      <span className="live-dot">Live</span>
                      <span
                        className={`badge-access ${accessMap[ev.id] ? 'active' : 'inactive'}`}
                      >
                        {accessMap[ev.id] ? (
                          <>
                            <CircleCheckBig size={11} /> Active
                          </>
                        ) : (
                          <>
                            <CircleX size={11} /> Locked
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="event-header">
                    <span className="badge badge-stream">
                      <Play size={11} /> {ev.streamType}
                    </span>
                  </div>

                  <div>
                    <h4>{ev.title}</h4>
                    <p className="desc">{ev.description}</p>
                  </div>

                  <div className="event-meta">
                    <div className="meta-item">
                      <span>Venue</span>
                      <strong>{ev.venue}</strong>
                    </div>
                    <div className="meta-item">
                      <span>Kickoff</span>
                      <strong>{ev.startTime}</strong>
                    </div>
                    <div className="meta-item">
                      <span>Ticket</span>
                      <strong>{ev.ticketPrice} SPRX</strong>
                    </div>
                    <div className="meta-item">
                      <span>Burn Rate</span>
                      <strong>{ev.pricePerMinute} SPRX/min</strong>
                    </div>
                  </div>

                  <div className="access-panel">
                    <div className="input-row">
                      <div className="input-group">
                        <label>Minutes</label>
                        <input
                          type="number"
                          min="1"
                          value={inp.minutes}
                          onChange={(e) =>
                            handleInputChange(ev.id, 'minutes', e.target.value)
                          }
                        />
                      </div>
                      <div className="input-group">
                        <label>Tokens to burn</label>
                        <input
                          type="number"
                          min="1"
                          value={inp.amount}
                          onChange={(e) =>
                            handleInputChange(ev.id, 'amount', e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="access-actions">
                      <button
                        className="btn-primary btn-sm"
                        onClick={() => handleBurn(ev.id)}
                      >
                        <Zap size={12} /> Burn SPRX
                      </button>
                      <button
                        className="btn-cyan btn-sm"
                        onClick={() => handlePayStable(ev.id)}
                      >
                        <Coins size={12} /> Pay USDC
                      </button>
                      <button
                        className="btn-ghost btn-sm"
                        onClick={() => handleMint(ev.id)}
                        disabled={!isOwner}
                      >
                        <Ticket size={12} /> Mint NFT
                      </button>
                      <button
                        className="btn-success btn-sm"
                        onClick={() => handleStartStream(ev.id)}
                      >
                        <Play size={12} /> Stream
                      </button>
                    </div>

                    {grantMap[ev.id] && (
                      <p className="grant-info">
                        Access until {grantMap[ev.id]}
                      </p>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}

      {/* ─────────── EXCHANGE TAB ─────────── */}
      {tab === 'exchange' && (
        <section className="exchange-section">
          <div className="exchange-card">
            <h3>
              <ArrowRightLeft size={18} /> Token Exchange
            </h3>
            <p className="desc">
              Swap between USDC and SPRX at the on-chain rate of{' '}
              <strong>{exchangeRate} SPRX / USDC</strong>
            </p>

            <div className="section-tabs" style={{ marginBottom: '1rem' }}>
              <button
                className={`tab-btn ${exchangeMode === 'buy' ? 'active' : ''}`}
                onClick={() => setExchangeMode('buy')}
              >
                Buy SPRX
              </button>
              <button
                className={`tab-btn ${exchangeMode === 'sell' ? 'active' : ''}`}
                onClick={() => setExchangeMode('sell')}
              >
                Sell SPRX
              </button>
            </div>

            <div className="exchange-row">
              <div className="exchange-field">
                <label>
                  {exchangeMode === 'buy' ? 'USDC Amount' : 'SPRX Amount'}
                </label>
                <div className="exchange-input-wrap">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={exchangeAmount}
                    onChange={(e) => setExchangeAmount(e.target.value)}
                  />
                  <span className="token-tag">
                    {exchangeMode === 'buy' ? 'USDC' : 'SPRX'}
                  </span>
                </div>
              </div>

              {exchangePreview && (
                <div className="exchange-output">
                  You receive <strong>{exchangePreview}</strong> (before fees)
                </div>
              )}
            </div>

            <div className="exchange-actions">
              <button className="btn-primary" onClick={handleExchange}>
                <ArrowRightLeft size={14} />{' '}
                {exchangeMode === 'buy' ? 'Buy SPRX' : 'Sell SPRX'}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── Status bar ── */}
      <div className="status-bar">
        <span className="status-label">Status</span>
        <span className="status-msg">
          {status || 'Ready — connect wallet and select an action.'}
        </span>
      </div>
    </div>
  )
}

export default App
