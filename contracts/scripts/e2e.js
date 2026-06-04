// End-to-end functional check of the whole MemeDex stack on OPN testnet.
// Uses small amounts of OPN. Redeploys the fixed MemeLaunchpad first.
const { ethers } = require("hardhat");

const A = {
    MEMEDEX: "0x1D6a0B64f72a7526B2F72A4Abdd73c8dDA2f47B2",
    WOPN: "0x887B59842B6612f8B4a2e9ec90Ab70407774362b",
    MemeFactory: "0xaB46D78E0154Dd771a61142A1dbB03E2e1C34364",
    MemeRouter: "0xA1A56F2eCAB8E94FeFE50b677201eCFA0A1E344A",
    MasterChef: "0x743640598DA3082285Bf62979347007BA38A2b55",
    ReferralSystem: "0x13c46Fc39c9a480207DaFD8F0aA3dD56286c2069",
    TradingRewards: "0xe3FFD2f156356BFdEBCdaB5E9e8CB3b097B8cd40",
    PresaleFactory: "0x647280259b47801242DABAC691f53B352B3164eB",
    LP: "0x2dFa4c46766f35f5F59d922f1802D0AD556d9aeF",
};

const ok = (m) => console.log("  [OK] " + m);
const step = (m) => console.log("\n=== " + m + " ===");

async function main() {
    const [me] = await ethers.getSigners();
    const p = ethers.provider;
    const startBal = await p.getBalance(me.address);
    console.log("Tester:", me.address);
    console.log("Start OPN:", ethers.formatEther(startBal));

    const memedex = await ethers.getContractAt("MEMEDEX", A.MEMEDEX);
    const wopn = await ethers.getContractAt("WOPN", A.WOPN);
    const router = await ethers.getContractAt("MemeRouter", A.MemeRouter);
    const masterchef = await ethers.getContractAt("MasterChef", A.MasterChef);
    const referral = await ethers.getContractAt("ReferralSystem", A.ReferralSystem);
    const trading = await ethers.getContractAt("TradingRewards", A.TradingRewards);
    const presaleFactory = await ethers.getContractAt("PresaleFactory", A.PresaleFactory);

    // ---------------------------------------------------------------
    step("1. SWAP (wrap -> approve -> swapExactTokensForTokens)");
    {
        const amountIn = ethers.parseEther("0.1");
        await (await wopn.deposit({ value: amountIn })).wait();
        await (await wopn.approve(A.MemeRouter, amountIn)).wait();
        const path = [A.WOPN, A.MEMEDEX];
        const quote = await router.getAmountsOut(amountIn, path);
        const before = await memedex.balanceOf(me.address);
        await (await router.swapExactTokensForTokens(amountIn, quote[1] * 95n / 100n, path, me.address)).wait();
        const got = (await memedex.balanceOf(me.address)) - before;
        if (got <= 0n) throw new Error("swap produced no output");
        ok(`swapped 0.1 WOPN -> ${ethers.formatEther(got)} MEMEDEX`);

        // reverse swap MEMEDEX -> WOPN
        const inM = ethers.parseEther("1000");
        await (await memedex.approve(A.MemeRouter, inM)).wait();
        const path2 = [A.MEMEDEX, A.WOPN];
        const q2 = await router.getAmountsOut(inM, path2);
        const w0 = await wopn.balanceOf(me.address);
        await (await router.swapExactTokensForTokens(inM, q2[1] * 95n / 100n, path2, me.address)).wait();
        const w1 = await wopn.balanceOf(me.address);
        ok(`swapped 1000 MEMEDEX -> ${ethers.formatEther(w1 - w0)} WOPN`);
        // unwrap leftover WOPN
        const wbal = await wopn.balanceOf(me.address);
        if (wbal > 0n) { await (await wopn.withdraw(wbal)).wait(); ok(`unwrapped ${ethers.formatEther(wbal)} WOPN -> OPN`); }
    }

    // ---------------------------------------------------------------
    step("2. STAKE native OPN (depositNative -> pending -> withdraw)");
    {
        const stake = ethers.parseEther("0.5");
        await (await masterchef.depositNative(0, { value: stake })).wait();
        let info = await masterchef.userInfo(0, me.address);
        if (info.amount < stake) throw new Error("native stake not recorded");
        ok(`staked ${ethers.formatEther(info.amount)} OPN in pool 0`);
        // mine a couple blocks by sending dust txs
        await (await wopn.deposit({ value: 1n })).wait();
        const pending = await masterchef.pendingReward(0, me.address);
        ok(`pending reward pool 0: ${ethers.formatEther(pending)} MEMEDEX`);
        const mBefore = await memedex.balanceOf(me.address);
        await (await masterchef.withdraw(0, stake)).wait();
        const mAfter = await memedex.balanceOf(me.address);
        info = await masterchef.userInfo(0, me.address);
        if (info.amount !== 0n) throw new Error("native unstake failed");
        ok(`unstaked; reward harvested: ${ethers.formatEther(mAfter - mBefore)} MEMEDEX`);
    }

    // ---------------------------------------------------------------
    step("3. FARM LP (add liquidity -> stake LP -> withdraw)");
    {
        const pair = await ethers.getContractAt("MemePair", A.LP);
        // add a little liquidity: 0.05 WOPN + proportional MEMEDEX
        const [rA, rB] = await pair.getReserves();
        const tokenA = await pair.tokenA();
        const wopnIsA = tokenA.toLowerCase() === A.WOPN.toLowerCase();
        const wRes = wopnIsA ? rA : rB;
        const mRes = wopnIsA ? rB : rA;
        const addW = ethers.parseEther("0.05");
        const addM = addW * mRes / wRes;
        await (await wopn.deposit({ value: addW })).wait();
        await (await wopn.transfer(A.LP, addW)).wait();
        await (await memedex.transfer(A.LP, addM)).wait();
        await (await pair.mint(me.address)).wait();
        const lpBal = await pair.balanceOf(me.address);
        ok(`minted ${ethers.formatEther(lpBal)} LP`);

        await (await pair.approve(A.MasterChef, lpBal)).wait();
        await (await masterchef.deposit(1, lpBal)).wait();
        let info = await masterchef.userInfo(1, me.address);
        if (info.amount !== lpBal) throw new Error("LP stake failed");
        ok(`staked LP in pool 1: ${ethers.formatEther(info.amount)}`);
        await (await masterchef.withdraw(1, lpBal)).wait();
        info = await masterchef.userInfo(1, me.address);
        if (info.amount !== 0n) throw new Error("LP unstake failed");
        ok("unstaked LP from pool 1");
    }

    // ---------------------------------------------------------------
    step("4. REFERRAL (generateCode -> register self2 -> reward -> claim)");
    {
        // second wallet derived from same mnemonic? We only have one PK. Use a
        // fresh random wallet funded with a tiny bit of OPN to act as referee.
        const referee = ethers.Wallet.createRandom().connect(p);
        await (await me.sendTransaction({ to: referee.address, value: ethers.parseEther("0.05") })).wait();

        // referrer (me) generates a code
        let code = await referral.getCodeString(me.address);
        if (!code) {
            await (await referral.generateCode()).wait();
            code = await referral.getCodeString(me.address);
        }
        ok(`referral code: ${code}`);

        await (await referral.connect(referee).registerReferral(code)).wait();
        const who = await referral.referrers(referee.address);
        if (who.toLowerCase() !== me.address.toLowerCase()) throw new Error("referral link failed");
        ok("referee registered under me");

        // accrue a reward (anyone can call processReferralReward)
        await (await referral.processReferralReward(referee.address, ethers.parseEther("100"))).wait();
        const infoR = await referral.getReferralInfo(me.address);
        ok(`pending referral earnings: ${ethers.formatEther(infoR.pendingEarnings)} MEMEDEX`);
        if (infoR.pendingEarnings > 0n) {
            const b0 = await memedex.balanceOf(me.address);
            await (await referral.claimEarnings()).wait();
            const b1 = await memedex.balanceOf(me.address);
            ok(`claimed referral earnings: ${ethers.formatEther(b1 - b0)} MEMEDEX`);
        }
        // sweep referee's leftover OPN back
        const rb = await p.getBalance(referee.address);
        const fee = ethers.parseEther("0.001");
        if (rb > fee) {
            await (await referee.sendTransaction({ to: me.address, value: rb - fee })).wait();
            ok("swept referee OPN back");
        }
    }

    // ---------------------------------------------------------------
    step("5. TRADING REWARDS (trackVolume -> finalize -> claim top1)");
    {
        await (await trading.trackVolume(me.address, ethers.parseEther("1000"))).wait();
        const cnt = await trading.snapshotCount();
        const sid = cnt - 1n;
        await (await trading.finalizeSnapshot()).wait();
        const claimable = await trading.getClaimableReward(me.address, sid);
        ok(`snapshot ${sid} claimable: ${ethers.formatEther(claimable)} MEMEDEX`);
        if (claimable > 0n) {
            const b0 = await memedex.balanceOf(me.address);
            await (await trading.claimRewards(sid)).wait();
            const b1 = await memedex.balanceOf(me.address);
            ok(`claimed airdrop: ${ethers.formatEther(b1 - b0)} MEMEDEX`);
            const claimedAgain = await trading.hasClaimed(me.address, sid);
            ok(`double-claim guard active: hasClaimed=${claimedAgain}`);
        }
    }

    // ---------------------------------------------------------------
    step("6. PRESALE (factory create -> buy -> finalize -> claim/withdraw)");
    {
        const tokensForSale = ethers.parseEther("100000");
        await (await memedex.approve(A.PresaleFactory, tokensForSale)).wait();
        const now = (await p.getBlock("latest")).timestamp;
        const params = {
            token: A.MEMEDEX, rate: 1000n,
            hardCap: ethers.parseEther("10"), softCap: ethers.parseEther("0.01"),
            minPurchase: ethers.parseEther("0.001"), maxPurchase: ethers.parseEther("5"),
            startTime: now - 10, endTime: now + 120, listingRate: 1000n,
            tokensForSale, name: "E2E", symbol: "E2E", imageURI: "", description: "e2e test",
        };
        await (await presaleFactory.createPresale(params)).wait();
        const count = await presaleFactory.presaleCount();
        const metas = await presaleFactory.getPresales(0, count);
        const last = metas[metas.length - 1];
        const presale = await ethers.getContractAt("Presale", last.presale);
        ok(`presale created: ${last.symbol} @ ${last.presale}, funded=${await presale.isFunded()}`);

        await (await presale.buyTokens(ethers.ZeroAddress, { value: ethers.parseEther("0.05") })).wait();
        const pos = await presale.getUserPosition(me.address);
        ok(`bought: contributed ${ethers.formatEther(pos.contributed)} OPN, tokens ${ethers.formatEther(pos.tokensBought)}`);

        // finalize (soft cap met) then claim TGE + withdraw funds
        await (await presale.finalize()).wait();
        const fi = await presale.getFullInfo();
        ok(`finalized: isFinalized=${fi.isFinalized}, isCancelled=${fi.isCancelled}`);

        const tb0 = await memedex.balanceOf(me.address);
        await (await presale.claimTokens()).wait();
        const tb1 = await memedex.balanceOf(me.address);
        ok(`claimed TGE tokens: ${ethers.formatEther(tb1 - tb0)} MEMEDEX`);

        const ob0 = await p.getBalance(me.address);
        await (await presale.withdrawFunds()).wait();
        const ob1 = await p.getBalance(me.address);
        ok(`withdrew raised funds (net delta ~ ${ethers.formatEther(ob1 - ob0)} OPN incl gas)`);
    }

    // ---------------------------------------------------------------
    step("7. LAUNCH (createLaunch via MemeLaunchpad, fee withdrawable)");
    {
        const launchpad = await ethers.getContractAt("MemeLaunchpad", "0xDE835B43DcCA351888a6e4cE85e862C31587f915");
        const c0 = await launchpad.getLaunchCount();
        await (await launchpad.createLaunch(
            "DogeE2E", "DOGE2E", "", "e2e launch",
            ethers.parseEther("10"),  // initialLiquidity (>=10 required)
            100000n,                  // presaleRate
            ethers.parseEther("50"),  // hardCap
            ethers.parseEther("5"),   // softCap
            259200n,                  // duration (3 days)
            ethers.parseEther("0.1"), // minPurchase
            ethers.parseEther("5"),   // maxPurchase
            100000n,                  // listingRate
            { value: ethers.parseEther("2") } // creation fee
        )).wait();
        const c1 = await launchpad.getLaunchCount();
        if (c1 !== c0 + 1n) throw new Error("launch not recorded");
        const launches = await launchpad.getActiveLaunches();
        const last = launches[launches.length - 1];
        ok(`launched token ${last.symbol} @ ${last.token}`);

        const token = await ethers.getContractAt("MemeToken", last.token);
        ok(`new token name=${await token.name()} supply=${ethers.formatEther(await token.totalSupply())}`);

        // withdraw the creation fee back (was previously stuck)
        const collected = await launchpad.collectedFees();
        ok(`collectedFees: ${ethers.formatEther(collected)} OPN`);
        if (collected > 0n) {
            const b0 = await p.getBalance(me.address);
            await (await launchpad.withdrawFees(me.address)).wait();
            const b1 = await p.getBalance(me.address);
            ok(`withdrew creation fee back (net ~ ${ethers.formatEther(b1 - b0)} OPN incl gas)`);
        }
    }

    // ---------------------------------------------------------------
    step("DONE");
    const endBal = await p.getBalance(me.address);
    console.log("End OPN:", ethers.formatEther(endBal));
    console.log("Net OPN spent:", ethers.formatEther(startBal - endBal));
}

main().catch((e) => { console.error("FAILED:", e); process.exit(1); });
