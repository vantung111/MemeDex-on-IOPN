# MemeDex — Meme Trading & Yield Hub on OPN Chain

## 1. Concept & Vision

MemeDex là một nền tảng DeFi chuyên về meme token trên OPN Chain, mang phong cách "internet-native" với giao diện sôi động, colorful, mang cảm giác như một sàn giao dịch meme thực thụ. Platform kết hợp AMM swap, staking/farming yield, launchpad meme token, presale, airdrop top traders, và referral system — tất cả trong một giao diện web3 mượt mà. Tầm nhìn là trở thành meme hub mặc định trên OPN Chain, nơi cộng đồng có thể trade, farm, và launch meme một cách dễ dàng.

---

## 2. Design Language

### Color Palette
- **Background**: `#0d0d1a` (deep space navy)
- **Surface**: `#161627` (card backgrounds)
- **Surface Light**: `#1e1e35` (elevated cards)
- **Border**: `#2a2a45` (subtle borders)
- **Primary**: `#8b5cf6` (violet — brand color)
- **Primary Hover**: `#7c3aed`
- **Accent**: `#06d6a0` (teal/mint — success, positive)
- **Warning**: `#fbbf24` (amber — pending, caution)
- **Danger**: `#ef4444` (red — errors, negative)
- **Text Primary**: `#ffffff`
- **Text Secondary**: `#94a3b8`
- **Text Muted**: `#64748b`

### Typography
- **Font**: Inter (headings, UI), JetBrains Mono (numbers, addresses, contract data)
- **Headings**: 700 weight, tracking tight
- **Body**: 400/500 weight, 1.5 line height
- **Mono**: JetBrains Mono for addresses, TX hashes, token amounts

### Spatial System
- Base unit: 4px
- Padding: 16px (sm), 24px (md), 32px (lg)
- Border radius: 8px (buttons), 12px (cards), 16px (modals)
- Max content width: 1280px

### Motion Philosophy
- Entrance: fade + translateY(-8px), 300ms ease-out
- Hover: scale(1.02), 150ms ease
- Loading: skeleton pulse animation
- Page transitions: 200ms fade
- Micro-interactions: button press scale(0.97), 100ms

### Visual Assets
- Lucide icons (react-icons)
- Custom SVG meme-style illustrations
- Gradient accents on hero sections
- Glowing effects on primary buttons

---

## 3. OPN Chain Configuration

```javascript
const OPN_CONFIG = {
  chainId: 984,
  chainIdHex: '0x3d8',
  networkName: 'OPN Testnet',
  rpcUrl: 'https://testnet-rpc.iopn.tech',
  wsUrl: 'wss://testnet-ws.iopn.tech',
  symbol: 'OPN',
  name: 'OPN Testnet',
  decimals: 18,
  minGasPrice: '7000000000', // 7 Gwei
  blockExplorer: 'https://testnet.iopn.tech',
  faucet: 'https://faucet.iopn.tech',
};
```

---

## 4. Smart Contract Architecture

### Core Contracts (Hardhat + Solidity 0.8.x)

#### 4.1 `MEMEDEX.sol` — Native Meme Token
- **Symbol**: `MEMEDEX`
- **Name**: `MemeDex Token`
- **Total Supply**: 10,000,000 (10M) tokens
- **Features**: ERC20 standard + Ownable
- **Distribution on deploy**:
  - 50% → Liquidity Pool (locked)
  - 30% → MasterChef rewards pool
  - 10% → Presale allocation
  - 5% → Airdrop & Trading Rewards pool
  - 5% → Team & Marketing
- **Owner**: Deployer address (timelock proposed for V2)

#### 4.2 `MasterChef.sol` — Staking & Farming Engine
- **Mechanism**: MasterChef (Sushiswap-style) with adjustable rewards per block
- **Native Staking**: Stake OPN or LP tokens → earn MEMEDEX
- **Farming Pools**: Multiple pools for different LP pairs
- **Rewards**: 10,000 MEMEDEX per block (configurable)
- **Pool Types**:
  - Pool 0: Native staking (OPN) — 20% of rewards
  - Pool 1-5: LP token farms — 80% split equally, can be adjusted
- **Dev & Treasury**: 10% performance fee

#### 4.3 `MemeLaunchpad.sol` — Launch New Memes
- **Anyone can create a new meme**: pay creation fee in OPN
- **Parameters per launch**:
  - `name`, `symbol`
  - `initialLiquidity` (in OPN)
  - `presaleRate` (tokens per OPN)
  - `presaleHardCap`
  - `presaleDuration` (seconds)
- **Auto liquidity lock**: 80% of raised OPN + minted tokens locked via MasterChef
- **Fee**: 2 OPN creation fee

#### 4.4 `Presale.sol` — Presale for Launched Memes
- **Per-meme presale contract** (factory pattern)
- **Whitelist**: Optional (owner can set)
- **Stages**: Whitelist → Public → Finalize
- **Minimum purchase**: 0.01 OPN
- **TGE**: 50% on finalize, 50% vests over 30 days (linear)
- **Referral integration**: 5% of purchase goes to referrer in MEMEDEX

#### 4.5 `TradingRewards.sol` — Top 20 Airdrop
- **Tracks trading volume per address**
- **Snapshot**: Every 7 days
- **Top 20 traders** by volume receive airdrop in MEMEDEX
- **Distribution**: Top 1 = 30%, Top 2-5 = 15% each, Top 6-10 = 5% each, Top 11-20 = 2% each
- **Batch distribution by owner**

#### 4.6 `ReferralSystem.sol` — Invite Rewards
- **Register referral**: One-time registration linking referrer ↔ referee
- **Referral code**: 6-character alphanumeric code
- **Rewards**: 5% of referee's swap fees in MEMEDEX
- **Multi-level**: L1 only (direct invites)
- **Reward pool**: 10% of total MEMEDEX supply

### Supporting Contracts

#### 4.7 `MemePair.sol` — AMM Pair (simplified)
- Basic constant-product AMM
- Factory creates pairs
- 0.3% swap fee, 0.25% to LP, 0.05% to protocol

#### 4.8 `MemeRouter.sol` — Swap Router
- Swap OPN ↔ any MEME token
- Swap between MEME tokens
- Uses MemePair for liquidity

---

## 5. Frontend Architecture

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS v3
- **Web3**: Viem + Wagmi v2
- **Wallet**: MetaMask, WalletConnect, Coinbase Wallet
- **State**: Zustand
- **Charts**: Recharts
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

### Page Structure

```
/                   — Landing + Hero (connects wallet CTA)
/swap               — Swap interface (AMM)
/stake              — Native staking (OPN, earn MEMEDEX)
/farm                — LP farming pools
/launch             — Launch new meme token
/presale            — Browse & participate in presales
/launchpad-meme/[id] — Individual meme detail + presale
/airdrop            — Trading rewards leaderboard
/referral           — Referral dashboard
/profile            — User portfolio (balances, positions, history)
```

### Key Components

| Component | Description |
|---|---|
| `Navbar` | Navigation, wallet connect, MEMEDEX balance display |
| `WalletConnect` | Multi-wallet modal, network detection, auto-switch to OPN |
| `TokenSelector` | Search/select tokens for swap |
| `SwapCard` | Main swap interface with slippage settings |
| `PoolCard` | Staking/farm pool display with APY, TVL |
| `LaunchForm` | Create new meme form with validation |
| `PresaleCard` | Presale listing card with countdown, progress bar |
| `Leaderboard` | Top 20 trading volume table |
| `ReferralPanel` | Referral code generator, invite link, earnings tracker |
| `PortfolioSummary` | User's aggregated positions across all pools |

---

## 6. Feature Specifications

### 6.1 Meme Gốc (Native MEMEDEX Token)
- Token contract deployed on OPN Testnet
- Initial liquidity pool: MEMEDEX/OPN pair seeded with 5M MEMEDEX + OPN
- Tokenomics visible on landing page

### 6.2 Swap Meme
- Swap any token ↔ MEMEDEX or any registered meme
- Input/output amount, slippage tolerance (0.5%, 1%, 3%, custom)
- Price impact display
- Route visualization for multi-hop
- Transaction history per wallet

### 6.3 Staking (Native)
- Stake OPN → earn MEMEDEX
- APY display (calculated from recent blocks)
- Unstake anytime (no lock, no penalty)
- Compound button (reinvest rewards)
- TVL (Total Value Locked) display

### 6.4 Farming (LP)
- Stake LP tokens → earn MEMEDEX
- Multiple pools with different weights
- Auto-compound option
- Pending rewards display (real-time via WebSocket)

### 6.5 Launch Meme
- Form: Name, Symbol, Description, Initial Liquidity, Presale rate, Hard cap, Duration
- Creation fee: 2 OPN
- Auto-generates: token contract + presale contract + LP pair
- Progress tracker (creation → presale → listing)

### 6.6 Presale
- Browse active presales
- Participate with OPN
- Whitelist management (for project owners)
- Claim tokens post-TGE
- Vesting schedule visualization
- Referral integration

### 6.7 Airdrop (Top 20 Trading)
- Weekly snapshot of trading volume
- Public leaderboard (top 20)
- User's own rank + volume
- Airdrop claim button
- Historical snapshots archive

### 6.8 Referral System
- Generate unique referral code
- Share invite link
- Track referee signups
- Earnings dashboard
- Auto-claim rewards

---

## 7. Scoring Alignment with IOPN Builder's Programme

| IOPN Criterion | MemeDex Alignment |
|---|---|
| OPN Chain Integration (30%) | All core features built on OPN Chain with load-bearing smart contracts |
| Technical Quality (25%) | Full-stack: Solidity + Hardhat + Next.js, contracts deployed on-chain |
| Product & UX (20%) | 8 integrated features, polished UI, wallet-first design |
| Innovation (15%) | First meme-focused DEX on OPN Chain with combined launchpad + farming |
| Builder Commitment (10%) | Complete dapp, deployed on testnet, community-ready |

---

## 8. Technical Decisions

### Why this stack:
- **Viem + Wagmi**: Official recommended stack for EVM chains, tree-shakable, type-safe
- **Next.js App Router**: SEO-friendly landing, server components for static content
- **Tailwind CSS**: Rapid iteration, consistent design system
- **Hardhat**: Best DX for Solidity on EVM chains

### Security Considerations:
- All contracts use OpenZeppelin modules
- MasterChef has emergency withdraw
- Presale has reentrancy guards
- Referral codes are hash-based (no collision)
- Initial LP tokens locked via time-lock pattern

### Deployment Strategy:
1. Deploy to OPN Testnet first (all contracts)
2. Seed initial liquidity
3. Verify contracts on block explorer
4. Submit to IOPN Builders Programme

---

## 9. File Structure

```
memedex/
├── contracts/
│   ├── MEMEDEX.sol
│   ├── MasterChef.sol
│   ├── MemeLaunchpad.sol
│   ├── Presale.sol
│   ├── TradingRewards.sol
│   ├── ReferralSystem.sol
│   ├── MemePair.sol
│   ├── MemeRouter.sol
│   └── lib/
│       (OpenZeppelin imports via npm)
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── config/
│   │   └── store/
│   ├── public/
│   └── package.json
├── test/
├── hardhat.config.ts
├── package.json
└── README.md
```
