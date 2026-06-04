#!/bin/bash
# One-command setup: installs all dependencies, compiles contracts, runs tests

set -e

echo "=== MemeDex Setup Script ==="
echo ""

echo "[1/5] Installing root dependencies..."
npm install

echo ""
echo "[2/5] Installing contract dependencies..."
cd contracts
npm install

echo ""
echo "[3/5] Compiling smart contracts..."
npx hardhat compile

echo ""
echo "[4/5] Running contract tests..."
npx hardhat test

echo ""
echo "[5/5] Installing frontend dependencies..."
cd ../frontend
npm install

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "To deploy contracts to OPN Testnet:"
echo "  1. Get testnet OPN: https://faucet.iopn.tech"
echo "  2. Add PRIVATE_KEY to contracts/.env"
echo "  3. cd contracts && npm run deploy"
echo "  4. Copy addresses to frontend/src/lib/config.ts"
echo "  5. cd ../frontend && npm run dev"
echo ""
echo "To run frontend only (without contracts):"
echo "  cd frontend && npm run dev"
