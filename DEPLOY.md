# MemeDex Deployment Guide

Complete step-by-step guide to deploy MemeDex on OPN Testnet.

## Prerequisites

1. **MetaMask wallet** with OPN Testnet added
2. **Testnet OPN tokens** — get from https://faucet.iopn.tech
3. **Private key** of your wallet (NEVER share this)

---

## Step 1: Quick Setup (One Command)

```bash
# Run from project root
bash scripts/setup.sh
```

This installs all dependencies, compiles contracts, and runs tests.

---

## Step 2: Configure Environment

```bash
cd contracts
cp .env.example .env
```

Edit `.env`:
```
PRIVATE_KEY=your_private_key_here
```

**How to get your private key:**
1. Open MetaMask
2. Click the 3 dots menu > Account Details > Show Private Key
3. Copy the key (starts with `0x`)

---

## Step 3: Get Testnet OPN

1. Go to https://faucet.iopn.tech
2. Connect your wallet
3. Claim OPN tokens
4. Do this 2-3 times (you need ~50+ OPN for deployment)

---

## Step 4: Deploy Contracts

```bash
cd contracts
npm run deploy
```

Expected output:
```
Deploying with account: 0x...
MEMEDEX: 0x...
WOPN: 0x...
MemeFactory: 0x...
MemeRouter: 0x...
MasterChef: 0x...
ReferralSystem: 0x...
TradingRewards: 0x...
MemeLaunchpad: 0x...
PresaleFactory: 0x...
LP pair seeded, MasterChef pools added
Saved to contracts/deployment-info.json
```

---

## Step 5: Update Frontend Config

Open `frontend/src/lib/config.ts` and update the `CONTRACTS` object with addresses from `contracts/deployment-info.json`:

```typescript
export const CONTRACTS = {
  MEMEDEX: '0x...',         // Your MEMEDEX address
  MemeFactory: '0x...',      // Your factory address
  MemeRouter: '0x...',      // Your router address
  MasterChef: '0x...',      // Your masterchef address
  ReferralSystem: '0x...',   // Your referral address
  TradingRewards: '0x...',  // Your trading rewards address
  MemeLaunchpad: '0x...',   // Your launchpad address
};
```

---

## Step 6: Build Frontend

```bash
cd frontend
npm run build
```

---

## Step 7: Deploy to Vercel (Recommended)

```bash
cd frontend
npx vercel --prod
```

Follow the prompts. Your app will be live at a `.vercel.app` URL.

**Or deploy manually:**
1. Push code to GitHub
2. Connect repo to Vercel
3. Vercel auto-detects Next.js and deploys

---

## Step 8: Add OPN Testnet to MetaMask

If not already added, use these settings:

| Setting | Value |
|---|---|
| Network Name | OPN Testnet |
| RPC URL | `https://testnet-rpc.iopn.tech` |
| Chain ID | `984` |
| Currency Symbol | `OPN` |
| Block Explorer | `https://testnet.iopn.tech` |

---

## Step 9: Verify Deployment

1. Open your frontend URL
2. Connect MetaMask
3. Switch to OPN Testnet
4. Check MEMEDEX balance
5. Try swapping

Verify contracts on explorer:
- Visit `https://testnet.iopn.tech`
- Search your contract addresses
- Click "Contract" tab to see source code

---

## Step 10: Record Demo Video

Use `scripts/demo-video-script.md` as your guide.

Tools:
- **OBS** (free): https://obsproject.com
- **Capcut** (free): https://capcut.com

---

## Step 11: Submit to IOPn Builders Programme

1. Go to https://builders.iopn.tech
2. Create/submit your project
3. Fill in the submission form:
   - Project name: MemeDex
   - Description: Use content from SUBMISSION.md
   - Demo video: Upload to YouTube, paste link
   - Repository: Link to GitHub repo
   - Contract addresses: Paste from deployment-info.json
4. Submit!

---

## Troubleshooting

### "Insufficient funds for gas"
Get more OPN from faucet: https://faucet.iopn.tech

### "Invalid chain ID"
Make sure MetaMask is connected to OPN Testnet (Chain ID: 984)

### "Contract not verified"
Run: `cd contracts && npx hardhat verify --network opnTestnet <ADDRESS>`

### "RPC error"
Check internet connection. Try switching RPC endpoints.

---

## Contract Summary

| Contract | Purpose |
|---|---|
| MEMEDEX | Platform token (10M supply) |
| MemeFactory | Creates LP token pairs |
| MemeRouter | Routes swap transactions |
| MasterChef | Distributes staking/farming rewards |
| ReferralSystem | Handles referral codes and rewards |
| TradingRewards | Tracks top 20 weekly traders |
| MemeLaunchpad | Creates new meme tokens |
| Presale | Manages token presales |
