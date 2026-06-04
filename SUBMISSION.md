# MemeDex — IOPn Builders Programme Submission

## Project Overview

**MemeDex** is the first dedicated meme token DEX on OPN Chain, combining AMM swap, yield farming, launchpad, presale, trading rewards, and referral system into a single cohesive platform.

**Built by**: Individual Builder
**Season**: Season 1 — DeFi & Open Finance
**Submission Date**: June 2026

---

## OPN Chain Integration (30%)

MemeDex uses OPN Chain as load-bearing infrastructure for all core operations:

| Feature | OPN Chain Usage |
|---|---|
| MEMEDEX Token | ERC-20 deployed on OPN, used for all rewards |
| AMM Swap | MemePair + MemeFactory contracts, CREATE2 for pair deployment |
| Staking/Farming | MasterChef with OPN-native and LP token pools |
| Token Launch | MemeLaunchpad deploys MemeToken clones via `new` operator |
| Presale | Presale contracts manage TGE + 30-day vesting on-chain |
| Trading Rewards | TradingRewards snapshots track volume per address on-chain |
| Referral System | ReferralSystem maps referrer ↔ referee with hash-based codes |

**Technical Details:**
- Chain ID: 984
- RPC: `https://testnet-rpc.iopn.tech`
- Smart Contracts: 10 Solidity 0.8.30 contracts
- All contract deployments verified on `https://testnet.iopn.tech`
- Gas optimization: viaIR compilation, optimizer runs=200
- TPS: supports 1,000+ complex DeFi ops (per OPN specs)

---

## Technical Quality (25%)

### Smart Contracts (12 contracts)
```
contracts/
├── MEMEDEX.sol           # ERC-20 native token (10M supply)
├── WOPN.sol              # Wrapped OPN for AMM swaps
├── MasterChef.sol        # Sushiswap-style staking/farming (native + LP)
├── MemeToken.sol        # Clonable ERC-20 (1B per meme)
├── MemeFactory.sol       # CREATE2 pair factory
├── MemePair.sol         # AMM pair (0.25% fee, K-invariant enforced)
├── MemeRouter.sol       # Swap router with multi-hop support
├── MemeLaunchpad.sol    # Token launchpad (2 OPN creation fee, withdrawable)
├── Presale.sol          # TGE 50% + 30-day vesting, refunds on cancel
├── PresaleFactory.sol   # Deploys, funds & registers presales
├── TradingRewards.sol   # Top 20 weekly airdrop (double-claim guarded)
└── ReferralSystem.sol   # 5% referral reward system (accrue + claim)
```

### Security Measures
- OpenZeppelin contracts for ERC-20, Ownable, ReentrancyGuard
- Reentrancy guards on all state-changing functions
- Emergency withdraw in MasterChef
- SafeMath via Solidity 0.8.x overflow protection
- Constant-product (K) invariant check in MemePair swaps
- Double-claim guards in TradingRewards; refund path in Presale

### Frontend Stack
- Next.js 14 (App Router)
- Tailwind CSS (dark theme, responsive)
- Wagmi + Viem (type-safe Web3)
- Zustand (state management)
- 37 passing contract tests

### Deployment
- Contracts: Hardhat deploy scripts
- Frontend: Vercel-ready (vercel.json included)
- Network: OPN Testnet (Chain ID: 984)

---

## Product & UX (20%)

### 8 Integrated Features
1. **Swap** — AMM swap between OPN and any meme token with slippage control
2. **Stake** — Native OPN staking, earn MEMEDEX, APY up to 248%
3. **Farm** — LP token staking, multi-pool farming with different alloc points
4. **Launch** — One-click meme token creation, 2 OPN fee, generates token + presale
5. **Presale** — Participate with OPN, TGE 50%, 30-day vesting
6. **Airdrop** — Weekly top 20 trader rewards (30% for #1 down to 2% each)
7. **Referral** — 5% of referee's MEMEDEX rewards, shareable codes
8. **Portfolio** — Unified view of all positions

### Design
- Dark theme: `#0d0d1a` background, `#8b5cf6` primary, `#06d6a0` accent
- Gradient text effects, glass morphism, card hover animations
- Mobile responsive across all pages
- Wallet connect modal with MetaMask support
- Real-time pending rewards display

---

## Innovation (15%)

### First Mover Advantage
- **First meme-specific DEX** on OPN Chain
- Combined launchpad + farming + trading rewards in one platform
- **Unique tokenomics**: MEMEDEX as platform token with multiple yield streams

### Differentiation from Generic AMMs
| Feature | Generic DEX | MemeDex |
|---|---|---|
| Meme launch | Not supported | 2 OPN, 1-click |
| Trading rewards | Not supported | Top 20 weekly |
| Referral system | Basic | 5% multi-level |
| Token creator | Manual | Fully on-chain |
| Meme-specific UI | Generic | Meme-culture theme |

---

## Builder Commitment (10%)

### What we've shipped
- 12 smart contracts (37 passing tests), all verified on-chain
- Full-stack Next.js frontend (8 feature pages, contract-integrated)
- Production-ready deployment scripts
- Complete documentation (SPEC.md, README.md, DEPLOY.md)
- This submission pitch

### Roadmap (Post-Builders Programme)
- V2: DAO governance for MEMEDEX
- V3: Cross-chain meme bridging
- V4: Meme NFT marketplace
- Ongoing: New farming pools, integrations

### Community
- Discord/Telegram community setup (planned)
- Bug bounty program (planned)

---

## Links

- **Video Demo**: [YouTube link — to be added]
- **Live Frontend**: [Vercel URL — to be added after deployment]
- **Contract Addresses**: See `deployment-info.json` after running `npm run deploy`
- **Block Explorer**: `https://testnet.iopn.tech`
- **RPC**: `https://testnet-rpc.iopn.tech`

---

## Contract Addresses (Deployed)

All contracts are live and **verified** on OPN Testnet (Chain ID: 984):

```typescript
// frontend/src/lib/config.ts
export const CONTRACTS = {
  MEMEDEX:         '0x1D6a0B64f72a7526B2F72A4Abdd73c8dDA2f47B2', // Native token (10M)
  WOPN:            '0x887B59842B6612f8B4a2e9ec90Ab70407774362b', // Wrapped OPN
  MemeFactory:     '0xaB46D78E0154Dd771a61142A1dbB03E2e1C34364', // Pair factory
  MemeRouter:      '0xA1A56F2eCAB8E94FeFE50b677201eCFA0A1E344A', // Swap router
  MasterChef:      '0x743640598DA3082285Bf62979347007BA38A2b55', // Staking/farming
  ReferralSystem:  '0x13c46Fc39c9a480207DaFD8F0aA3dD56286c2069', // Referral rewards
  TradingRewards:  '0xe3FFD2f156356BFdEBCdaB5E9e8CB3b097B8cd40', // Trading airdrop
  MemeLaunchpad:   '0xDE835B43DcCA351888a6e4cE85e862C31587f915', // Token launchpad
  PresaleFactory:  '0x647280259b47801242DABAC691f53B352B3164eB', // Presale factory
  MEMEDEX_WOPN_LP: '0x2dFa4c46766f35f5F59d922f1802D0AD556d9aeF', // Seeded LP pair
};
```

**Deployer**: `0x78D77536710Dc8EeF573749e6aE4c9Bb7dA42bCf`
**Deployed**: 2026-06-04

**Token Allocations (verified on-chain):**
- MasterChef: 3,000,000 MEMEDEX
- ReferralSystem: 500,000 MEMEDEX
- TradingRewards: 500,000 MEMEDEX
- Initial LP (MEMEDEX/WOPN): 500,000 MEMEDEX + 5 WOPN
- Deployer reserve: remainder
- **Total: 10,000,000 MEMEDEX** (matches total supply)

---

## Team Notes

- MemeDex is built to demonstrate real-world DeFi utility on OPN Chain
- All smart contracts are functional and testable
- The platform is designed for production use, not just demo
- We are committed to maintaining and improving the platform post-Builders Programme
