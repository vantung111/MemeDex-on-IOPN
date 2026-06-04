const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "OPN");

    // 1. MEMEDEX token
    const MEMEDEX = await ethers.getContractFactory("MEMEDEX");
    const memedex = await MEMEDEX.deploy(deployer.address);
    await memedex.waitForDeployment();
    const memedexAddress = await memedex.getAddress();
    console.log("MEMEDEX:", memedexAddress);

    // 2. WOPN (wrapped native)
    const WOPN = await ethers.getContractFactory("WOPN");
    const wopn = await WOPN.deploy();
    await wopn.waitForDeployment();
    const wopnAddress = await wopn.getAddress();
    console.log("WOPN:", wopnAddress);

    // 3. Factory
    const MemeFactory = await ethers.getContractFactory("MemeFactory");
    const factory = await MemeFactory.deploy(deployer.address);
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    console.log("MemeFactory:", factoryAddress);
    await (await factory.setProtocolFeeRecipient(deployer.address)).wait();

    // 4. Router
    const MemeRouter = await ethers.getContractFactory("MemeRouter");
    const router = await MemeRouter.deploy(factoryAddress);
    await router.waitForDeployment();
    const routerAddress = await router.getAddress();
    console.log("MemeRouter:", routerAddress);

    // 5. MasterChef
    const MasterChef = await ethers.getContractFactory("MasterChef");
    const masterChef = await MasterChef.deploy(memedexAddress, 0, deployer.address);
    await masterChef.waitForDeployment();
    const masterChefAddress = await masterChef.getAddress();
    console.log("MasterChef:", masterChefAddress);

    // 6. ReferralSystem
    const ReferralSystem = await ethers.getContractFactory("ReferralSystem");
    const referralSystem = await ReferralSystem.deploy(memedexAddress, deployer.address);
    await referralSystem.waitForDeployment();
    const referralAddress = await referralSystem.getAddress();
    console.log("ReferralSystem:", referralAddress);

    // 7. TradingRewards
    const TradingRewards = await ethers.getContractFactory("TradingRewards");
    const tradingRewards = await TradingRewards.deploy(memedexAddress, deployer.address);
    await tradingRewards.waitForDeployment();
    const rewardsAddress = await tradingRewards.getAddress();
    console.log("TradingRewards:", rewardsAddress);

    // 8. MemeLaunchpad
    const MemeLaunchpad = await ethers.getContractFactory("MemeLaunchpad");
    const launchpad = await MemeLaunchpad.deploy(factoryAddress, deployer.address);
    await launchpad.waitForDeployment();
    const launchpadAddress = await launchpad.getAddress();
    console.log("MemeLaunchpad:", launchpadAddress);

    // 9. PresaleFactory
    const PresaleFactory = await ethers.getContractFactory("PresaleFactory");
    const presaleFactory = await PresaleFactory.deploy(deployer.address);
    await presaleFactory.waitForDeployment();
    const presaleFactoryAddress = await presaleFactory.getAddress();
    console.log("PresaleFactory:", presaleFactoryAddress);

    // --- Token distribution (per SPEC) ---
    const totalSupply = await memedex.totalSupply();
    const masterChefAllocation = (totalSupply * 30n) / 100n; // 30%
    const rewardsAllocation = (totalSupply * 5n) / 100n;     // 5%
    const referralAllocation = (totalSupply * 5n) / 100n;    // 5%

    await (await memedex.transfer(masterChefAddress, masterChefAllocation)).wait();
    console.log("-> MasterChef:", ethers.formatEther(masterChefAllocation), "MEMEDEX");
    await (await memedex.transfer(rewardsAddress, rewardsAllocation)).wait();
    console.log("-> TradingRewards:", ethers.formatEther(rewardsAllocation), "MEMEDEX");
    await (await memedex.transfer(referralAddress, referralAllocation)).wait();
    console.log("-> ReferralSystem:", ethers.formatEther(referralAllocation), "MEMEDEX");

    // --- Create WOPN/MEMEDEX pair and seed liquidity ---
    console.log("\nCreating WOPN/MEMEDEX pair...");
    await (await factory.createPair(wopnAddress, memedexAddress)).wait();
    const pairAddress = await factory.getPair(wopnAddress, memedexAddress);
    console.log("LP pair:", pairAddress);

    const wopnLiquidity = ethers.parseEther("5");        // 5 OPN
    const memedexLiquidity = ethers.parseEther("500000"); // 500k MEMEDEX -> 1 OPN = 100k MEMEDEX

    // Wrap OPN -> WOPN, then move both tokens into the pair and mint LP.
    await (await wopn.deposit({ value: wopnLiquidity })).wait();
    await (await wopn.transfer(pairAddress, wopnLiquidity)).wait();
    await (await memedex.transfer(pairAddress, memedexLiquidity)).wait();
    const pair = await ethers.getContractAt("MemePair", pairAddress);
    await (await pair.mint(deployer.address)).wait();
    const lpBalance = await pair.balanceOf(deployer.address);
    console.log("Seeded liquidity. LP balance:", ethers.formatEther(lpBalance));

    // --- MasterChef pools ---
    // Pool 0: native OPN staking (20% of alloc)
    // Pool 1: WOPN/MEMEDEX LP farm (80% of alloc)
    console.log("\nAdding MasterChef pools...");
    await (await masterChef.addPool(200, ethers.ZeroAddress, true, false)).wait();
    await (await masterChef.addPool(800, pairAddress, false, false)).wait();
    console.log("Pool 0: native OPN staking (200 alloc)");
    console.log("Pool 1: WOPN/MEMEDEX LP farm (800 alloc)");

    const deploymentInfo = {
        network: "OPN Testnet",
        chainId: 984,
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        explorer: "https://testnet.iopn.tech",
        contracts: {
            MEMEDEX: memedexAddress,
            WOPN: wopnAddress,
            MemeFactory: factoryAddress,
            MemeRouter: routerAddress,
            MasterChef: masterChefAddress,
            ReferralSystem: referralAddress,
            TradingRewards: rewardsAddress,
            MemeLaunchpad: launchpadAddress,
            PresaleFactory: presaleFactoryAddress,
            MEMEDEX_WOPN_LP: pairAddress,
        },
    };

    fs.writeFileSync(
        path.join(__dirname, "..", "deployment-info.json"),
        JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("\n=== Deployment Complete ===");
    console.log(JSON.stringify(deploymentInfo.contracts, null, 2));
    console.log("\nSaved to contracts/deployment-info.json");
    console.log("Next: update frontend/src/lib/config.ts with these addresses.");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
