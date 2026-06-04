# MemeDex — Meme Trading & Yield Hub on OPN Chain

<p align="center">
  <img src="https://img.shields.io/badge/Chain-OPN%20Testnet%20984-8b5cf6?style=for-the-badge" alt="OPN Chain">
  <img src="https://img.shields.io/badge/Solidity-0.8.30-363636?style=for-the-badge" alt="Solidity">
  <img src="https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge" alt="Next.js">
  <img src="https://img.shields.io/badge/Tests-37%20passing-06d6a0?style=for-the-badge" alt="Tests">
</p>

The first dedicated meme token DEX on OPN Chain. Trade, stake, farm, launch, and earn — all in one platform.

> Built for the [IOPn Builders Programme](https://builders.iopn.tech) — Season 1: DeFi & Open Finance.

## Features

| # | Feature | Description |
|---|---|---|
| 1 | **Meme Token (MEMEDEX)** | Native platform token, 10M supply |
| 2 | **Swap** | AMM swap between OPN and any meme token |
| 3 | **Stake** | Stake OPN, earn MEMEDEX rewards (up to 248% APY) |
| 4 | **Farm** | Provide LP liquidity, earn MEMEDEX rewards |
| 5 | **Launch** | Create new meme token in one click (2 OPN fee) |
| 6 | **Presale** | Participate in meme presales with TGE + vesting |
| 7 | **Airdrop** | Top 20 traders earn weekly MEMEDEX airdrops |
| 8 | **Referral** | Earn 5% of your friends' MEMEDEX rewards |

## Tech Stack

| Layer | Technology |
|---|---|
| Blockchain | OPN Chain (EVM, Chain ID: 984) |
| Smart Contracts | Solidity 0.8.30, Hardhat |
| Security | OpenZeppelin Contracts v5 |
| Frontend | Next.js 14 (App Router), Tailwind CSS |
| Web3 | Wagmi v2 + Viem |
| State | Zustand |
| Testing | Hardhat + Mocha + Chai (37 tests passing) |

## Quick Start

### One-Command Setup

```bash
# Unix/macOS
bash scripts/setup.sh

# Windows (PowerShell)
cd scripts ; .\setup.sh
```

### Manual Setup

```bash
# 1. Install dependencies
npm install
cd contracts && npm install && cd ../frontend && npm install

# 2. Compile contracts
cd contracts && npx hardhat compile

# 3. Run tests
cd contracts && npx hardhat test

# 4. Deploy (requires .env with PRIVATE_KEY)
cd contracts && npm run deploy

# 5. Update frontend config and run
cd frontend && npm run dev
```

## Deployment

See [DEPLOY.md](./DEPLOY.md) for complete deployment instructions.

```bash
# After deployment, update:
frontend/src/lib/config.ts  # with contract addresses
```

## Project Structure

```
memedex/
├── contracts/
│   ├── contracts/
│   │   ├── MEMEDEX.sol            # Native platform token
│   │   ├── WOPN.sol              # Wrapped OPN (for AMM swaps)
│   │   ├── MasterChef.sol        # Staking & farming engine (native + LP)
│   │   ├── MemeToken.sol         # Clonable meme token (1B supply)
│   │   ├── MemeFactory.sol        # LP pair factory (CREATE2)
│   │   ├── MemePair.sol          # AMM pair (0.25% fee, K-invariant)
│   │   ├── MemeRouter.sol        # Swap router
│   │   ├── MemeLaunchpad.sol     # Token launchpad
│   │   ├── Presale.sol           # TGE 50% + 30-day vesting + refunds
│   │   ├── PresaleFactory.sol    # Deploys & registers presales
│   │   ├── TradingRewards.sol     # Top 20 weekly airdrop
│   │   ├── ReferralSystem.sol    # 5% referral rewards
│   │   └── mocks/
│   │       └── MockERC20.sol     # Test utilities
│   ├── scripts/
│   │   └── deploy.js             # Deployment script
│   ├── test/
│   │   └── contracts.test.js      # 37 passing tests
│   ├── hardhat.config.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/                  # Next.js App Router pages
│   │   │   ├── page.tsx         # Landing page
│   │   │   ├── swap/            # Swap page
│   │   │   ├── stake/           # Stake page
│   │   │   ├── farm/            # Farm page
│   │   │   ├── presale/         # Presale page
│   │   │   ├── airdrop/         # Airdrop page
│   │   │   ├── referral/        # Referral page
│   │   │   └── launch/          # Launch page
│   │   ├── components/          # UI components
│   │   ├── hooks/               # Web3 hooks
│   │   ├── lib/                 # Config, wagmi, utils
│   │   └── store/               # Zustand store
│   ├── package.json
│   ├── tailwind.config.js
│   └── vercel.json
├── scripts/
│   ├── setup.sh                 # One-command setup
│   ├── verify-deployment.sh     # Deployment verification
│   └── demo-video-script.md     # Demo video guide
├── SPEC.md                      # Full project specification
├── SUBMISSION.md                 # IOPn Builders Programme submission
└── DEPLOY.md                   # Deployment guide
```

## Smart Contracts

### Architecture

```
                    ┌─────────────────────┐
                    │     MEMEDEX         │
                    │   (10M supply)     │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
    ┌─────▼──────┐     ┌──────▼──────┐     ┌──────▼──────┐
    │ MasterChef  │     │ ReferralSys │     │TradingRewards│
    │  (staking)  │     │  (referral) │     │  (airdrop)   │
    └─────┬──────┘     └─────────────┘     └─────────────┘
          │
    ┌─────▼──────┐     ┌─────────────┐
    │MemeFactory  │────▶│  MemePair   │
    │  (pairs)   │     │  (AMM DEX)  │
    └─────┬──────┘     └──────┬──────┘
          │                   │
    ┌─────▼──────┐     ┌──────▼──────┐
    │MemeLaunchpad│     │ MemeRouter  │
    │  (launch)  │     │   (swap)    │
    └─────────────┘     └─────────────┘
```

### Security Features

- OpenZeppelin battle-tested libraries
- Reentrancy guards on all state-changing functions
- Emergency withdraw in MasterChef
- Solidity 0.8.x overflow protection
- Minimum liquidity lock in MemePair

## OPN Chain Configuration

| Parameter | Value |
|---|---|
| Chain ID | 984 (0x3d8) |
| Network | OPN Testnet |
| RPC | `https://testnet-rpc.iopn.tech` |
| WebSocket | `wss://testnet-ws.iopn.tech` |
| Block Explorer | `https://testnet.iopn.tech` |
| Faucet | `https://faucet.iopn.tech` |
| Min Gas Price | 7 Gwei |
| EVM Version | Pectra |

## Deployed Contracts (OPN Testnet)

| Contract | Address |
|---|---|
| MEMEDEX | `0x1D6a0B64f72a7526B2F72A4Abdd73c8dDA2f47B2` |
| WOPN | `0x887B59842B6612f8B4a2e9ec90Ab70407774362b` |
| MemeFactory | `0xaB46D78E0154Dd771a61142A1dbB03E2e1C34364` |
| MemeRouter | `0xA1A56F2eCAB8E94FeFE50b677201eCFA0A1E344A` |
| MasterChef | `0x743640598DA3082285Bf62979347007BA38A2b55` |
| ReferralSystem | `0x13c46Fc39c9a480207DaFD8F0aA3dD56286c2069` |
| TradingRewards | `0xe3FFD2f156356BFdEBCdaB5E9e8CB3b097B8cd40` |
| MemeLaunchpad | `0xDE835B43DcCA351888a6e4cE85e862C31587f915` |
| PresaleFactory | `0x647280259b47801242DABAC691f53B352B3164eB` |
| MEMEDEX/WOPN LP | `0x2dFa4c46766f35f5F59d922f1802D0AD556d9aeF` |

## IOPn Builders Programme Alignment

| Criterion | Weight | MemeDex Score |
|---|---|---|
| OPN Chain Integration | 30% | All 10 contracts native to OPN Chain |
| Technical Quality | 25% | 37 tests, Solidity 0.8.30, OpenZeppelin |
| Product & UX | 20% | 8 features, dark theme, responsive |
| Innovation | 15% | First meme DEX on OPN Chain |
| Builder Commitment | 10% | Complete dapp, docs, tests |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Ensure all tests pass: `cd contracts && npx hardhat test`
5. Submit a pull request

## License

MIT
