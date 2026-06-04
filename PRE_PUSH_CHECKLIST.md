# Pre-Push Checklist

Run through this list before `git push` to GitHub.

## 1. Remove Secrets

**Critical**: Delete the private key file before pushing.

```powershell
# Manual delete in File Explorer:
Remove-Item "d:\iopn\Meme dex\contracts\.env"
```

Or right-click the file in VS Code's file tree and choose Delete.

After deletion, verify `.env.example` still exists (it's safe to commit):

```powershell
Test-Path "d:\iopn\Meme dex\contracts\.env.example"
# Should return: True
```

## 2. Verify Build

```bash
cd "d:\iopn\Meme dex\frontend"
npm run build
```

Should complete with 11/11 pages built.

## 3. Run Tests

```bash
cd "d:\iopn\Meme dex\contracts"
npx hardhat test
```

Should show 37 passing.

## 4. Check No Sensitive Data

The grep below should return no results (replace `<DEPLOYER_KEY>` with your actual key only when running locally — never commit it):

```bash
git ls-files | xargs grep -l "<DEPLOYER_KEY>"
```

(empty output = good)

## 5. Initialize Git & Push

```bash
cd "d:\iopn\Meme dex"
git init
git add .
git status              # review files to be committed
git commit -m "MemeDex - meme DEX on OPN Chain"
git remote add origin https://github.com/YOUR_USERNAME/memedex.git
git branch -M main
git push -u origin main
```

## 6. After Push

- Add repo description on GitHub
- Add topics: `opn-chain`, `meme`, `defi`, `dex`, `solidity`, `nextjs`
- Consider making it public so OPN judges can review
- Pin important repos
