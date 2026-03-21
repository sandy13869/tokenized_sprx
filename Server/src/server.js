const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const { ethers } = require('ethers')
const crypto = require('crypto')

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const events = [
  {
    id: 1,
    title: 'Neo Tokyo Derby',
    venue: 'Neo Tokyo Arena',
    startTime: '2026-04-20 19:30 UTC',
    streamType: 'Multi-angle 8K VR',
    description: 'Live VR coverage with player overlays and AI highlights.',
    ticketPrice: '120',
    pricePerMinute: '8',
  },
  {
    id: 2,
    title: 'Pacific Surge Finals',
    venue: 'Bluewave Stadium',
    startTime: '2026-04-27 20:00 UTC',
    streamType: 'Holo-cam VR',
    description: 'Volumetric capture with real-time stats and commentary.',
    ticketPrice: '150',
    pricePerMinute: '10',
  },
  {
    id: 3,
    title: 'Orbit City Invitational',
    venue: 'Orbit City Dome',
    startTime: '2026-05-05 18:00 UTC',
    streamType: '360 Dome VR',
    description: 'Immersive dome stream with crowd audio spatialization.',
    ticketPrice: '95',
    pricePerMinute: '6',
  },
]

const ticketAbi = [
  'function hasTicketForEvent(address owner,uint256 eventId) view returns (bool)',
]

const accessAbi = [
  'function hasAccess(address user,uint256 eventId) view returns (bool)',
  'function accessGrants(address user,uint256 eventId) view returns (uint64 accessUntil,uint256 totalBurned,uint256 totalStablePaid)',
  'function sprxPerStable() view returns (uint256)',
  'function stableCostPerMinute() view returns (uint256)',
]

const provider = process.env.RPC_URL
  ? new ethers.JsonRpcProvider(process.env.RPC_URL)
  : null

const ticketContract =
  provider && process.env.TICKET_ADDRESS
    ? new ethers.Contract(process.env.TICKET_ADDRESS, ticketAbi, provider)
    : null

const accessContract =
  provider && process.env.ACCESS_ADDRESS
    ? new ethers.Contract(process.env.ACCESS_ADDRESS, accessAbi, provider)
    : null

app.get('/api/events', (_req, res) => {
  res.json({ events })
})

app.get('/api/exchange/rate', async (_req, res) => {
  if (!accessContract) {
    return res.status(501).json({ message: 'Access contract not configured.' })
  }
  try {
    const [sprxPerStable, stableCostPerMinute] = await Promise.all([
      accessContract.sprxPerStable(),
      accessContract.stableCostPerMinute(),
    ])
    return res.json({
      sprxPerStable: sprxPerStable.toString(),
      stableCostPerMinute: stableCostPerMinute.toString(),
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Failed to fetch exchange rate.' })
  }
})

app.post('/api/ticket/verify', async (req, res) => {
  const { wallet, eventId } = req.body

  if (!wallet || !eventId) {
    return res.status(400).json({ message: 'wallet and eventId required' })
  }

  if (!ticketContract) {
    return res
      .status(501)
      .json({ message: 'Ticket contract not configured on server.' })
  }

  try {
    const hasTicket = await ticketContract.hasTicketForEvent(wallet, eventId)
    return res.json({ wallet, eventId, hasTicket })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Ticket verification failed.' })
  }
})

app.post('/api/stream/start', async (req, res) => {
  const { wallet, eventId } = req.body

  if (!wallet || !eventId) {
    return res.status(400).json({ message: 'wallet and eventId required' })
  }

  if (!accessContract) {
    return res
      .status(501)
      .json({ message: 'Access contract not configured on server.' })
  }

  try {
    const hasAccess = await accessContract.hasAccess(wallet, eventId)
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied.' })
    }

    const sessionId = crypto.randomUUID()
    return res.json({ sessionId, eventId, wallet, status: 'active' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Stream start failed.' })
  }
})

app.post('/api/stream/end', (req, res) => {
  const { sessionId } = req.body

  if (!sessionId) {
    return res.status(400).json({ message: 'sessionId required' })
  }

  return res.json({ sessionId, status: 'closed' })
})

const port = process.env.PORT || 5000
app.listen(port, () => {
  console.log(`Tokenized SPRX server listening on ${port}`)
})
