# Security Notes

## Sensitive Files (DO NOT COMMIT)

The `.env` file contains the deployer private key and **must never be committed**.

This is already handled by `.gitignore`, but double-check before pushing:

```bash
# Should show nothing:
git ls-files | grep -E "\.env$|private|secret"

# Should show .env.example only:
find . -name ".env*" -not -path "*/node_modules/*"
```

## Public Information (Safe to Commit)

- `deployment-info.json` — contract addresses and deployer address only
- All contract source code in `contracts/contracts/`
- Frontend code in `frontend/src/`
- `hardhat.config.js` — only contains public RPC URL, no secrets

## If Private Key Leaks

1. **Move funds** to a new wallet immediately
2. Create new deployer wallet
3. Update `hardhat.config.js` with new key (locally only)
4. Re-deploy all contracts (new addresses!)
5. Update `frontend/src/lib/config.ts`
6. Never reuse the leaked key

## Wallet Best Practices

- Never share private keys
- Use different keys for testnet vs mainnet
- Consider hardware wallet (Ledger) for mainnet
- Use environment variables, never hardcode keys
