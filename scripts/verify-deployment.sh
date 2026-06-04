#!/bin/bash
# Deployment verification script
# Run after deploying contracts to OPN Testnet

echo "=== MemeDex Deployment Verification ==="
echo ""

# Check if deployment-info.json exists
if [ ! -f "contracts/deployment-info.json" ]; then
    echo "ERROR: deployment-info.json not found. Run 'npm run deploy' first."
    exit 1
fi

echo "1. Reading deployment addresses..."
cat contracts/deployment-info.json

echo ""
echo "2. Verifying MEMEDEX token..."
echo "   Check on: https://testnet.iopn.tech/address/YOUR_MEMEDEX_ADDRESS"

echo ""
echo "3. Checking testnet connectivity..."
curl -s -X POST https://testnet-rpc.iopn.tech \
    -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    | jq '.result'

echo ""
echo "4. Next steps:"
echo "   a. Update frontend/src/lib/config.ts with contract addresses"
echo "   b. cd frontend && npm run build"
echo "   c. Deploy to Vercel: npx vercel --prod"
echo "   d. Record demo video"
echo "   e. Submit at https://builders.iopn.tech"
