const { expect } = require("chai");
const { ethers } = require("hardhat");

// Lightweight revert matcher so we don't depend on @nomicfoundation/hardhat-chai-matchers.
async function expectRevert(promise, expectedSubstring) {
  try {
    const tx = await promise;
    if (tx && tx.wait) await tx.wait();
  } catch (err) {
    if (expectedSubstring) {
      expect(err.message).to.contain(expectedSubstring);
    }
    return;
  }
  throw new Error("Expected transaction to revert, but it succeeded");
}

describe("MEMEDEX Token", function () {
  let token, owner, user1;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();
    const MEMEDEX = await ethers.getContractFactory("MEMEDEX");
    token = await MEMEDEX.deploy(owner.address);
    await token.waitForDeployment();
  });

  it("should deploy with correct name and symbol", async function () {
    expect(await token.name()).to.equal("MemeDex Token");
    expect(await token.symbol()).to.equal("MEMEDEX");
  });

  it("should have total supply of 10M tokens", async function () {
    expect(await token.totalSupply()).to.equal(ethers.parseEther("10000000"));
  });

  it("should assign total supply to deployer", async function () {
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("10000000"));
  });

  it("should allow owner to mint tokens", async function () {
    await token.mint(user1.address, ethers.parseEther("1000"));
    expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("1000"));
  });

  it("should revert mint from non-owner", async function () {
    await expectRevert(token.connect(user1).mint(user1.address, 1n));
  });

  it("should allow token transfers", async function () {
    await token.transfer(user1.address, ethers.parseEther("100"));
    expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("100"));
  });

  it("should allow burning tokens", async function () {
    await token.burn(ethers.parseEther("100"));
    expect(await token.totalSupply()).to.equal(ethers.parseEther("9999900"));
  });
});

describe("MasterChef", function () {
  let masterChef, memedex, stakingToken, owner, user1;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();

    const MEMEDEX = await ethers.getContractFactory("MEMEDEX");
    memedex = await MEMEDEX.deploy(owner.address);
    await memedex.waitForDeployment();

    const MasterChef = await ethers.getContractFactory("MasterChef");
    masterChef = await MasterChef.deploy(memedex.target, 0, owner.address);
    await masterChef.waitForDeployment();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    stakingToken = await MockERC20.deploy("Staking Token", "STK", 18);
    await stakingToken.waitForDeployment();

    await memedex.transfer(masterChef.target, ethers.parseEther("3000000"));
    await masterChef.addPool(100, stakingToken.target, false, false);
  });

  it("should allow staking and update balance", async function () {
    await stakingToken.mint(user1.address, ethers.parseEther("1000"));
    await stakingToken.connect(user1).approve(masterChef.target, ethers.parseEther("1000"));
    await masterChef.connect(user1).deposit(0, ethers.parseEther("500"));

    const userInfo = await masterChef.userInfo(0, user1.address);
    expect(userInfo.amount).to.equal(ethers.parseEther("500"));
  });

  it("should calculate pending rewards correctly", async function () {
    await stakingToken.mint(user1.address, ethers.parseEther("1000"));
    await stakingToken.connect(user1).approve(masterChef.target, ethers.parseEther("1000"));
    await masterChef.connect(user1).deposit(0, ethers.parseEther("500"));

    await ethers.provider.send("evm_increaseTime", [100]);
    await ethers.provider.send("evm_mine", []);

    const pending = await masterChef.pendingReward(0, user1.address);
    expect(pending > 0n).to.equal(true);
  });

  it("should allow emergency withdraw", async function () {
    await stakingToken.mint(user1.address, ethers.parseEther("1000"));
    await stakingToken.connect(user1).approve(masterChef.target, ethers.parseEther("1000"));
    await masterChef.connect(user1).deposit(0, ethers.parseEther("500"));
    await masterChef.connect(user1).emergencyWithdraw(0);

    const userInfo = await masterChef.userInfo(0, user1.address);
    expect(userInfo.amount).to.equal(0n);
  });

  it("should allow withdrawal", async function () {
    await stakingToken.mint(user1.address, ethers.parseEther("1000"));
    await stakingToken.connect(user1).approve(masterChef.target, ethers.parseEther("1000"));
    await masterChef.connect(user1).deposit(0, ethers.parseEther("500"));
    await masterChef.connect(user1).withdraw(0, ethers.parseEther("200"));

    const userInfo = await masterChef.userInfo(0, user1.address);
    expect(userInfo.amount).to.equal(ethers.parseEther("300"));
  });

  it("should support native OPN staking via depositNative/withdraw", async function () {
    // Native pool at pid 1
    await masterChef.addPool(100, ethers.ZeroAddress, true, false);
    const stake = ethers.parseEther("1");
    await masterChef.connect(user1).depositNative(1, { value: stake });

    let info = await masterChef.userInfo(1, user1.address);
    expect(info.amount).to.equal(stake);

    await masterChef.connect(user1).withdraw(1, stake);
    info = await masterChef.userInfo(1, user1.address);
    expect(info.amount).to.equal(0n);
  });

  it("should reject native deposit into a non-native pool", async function () {
    await expectRevert(
      masterChef.connect(user1).depositNative(0, { value: ethers.parseEther("1") }),
      "Not native pool"
    );
  });
});

describe("MemeToken", function () {
  let token, owner, creator;

  beforeEach(async function () {
    [owner, creator] = await ethers.getSigners();
    const MemeToken = await ethers.getContractFactory("MemeToken");
    token = await MemeToken.deploy();
    await token.waitForDeployment();
    await token.initialize("Dogecoin", "DOGE", "https://example.com/doge.png", creator.address, owner.address);
  });

  it("should initialize with correct parameters", async function () {
    expect(await token.name()).to.equal("Dogecoin");
    expect(await token.symbol()).to.equal("DOGE");
    expect(await token.creator()).to.equal(creator.address);
    expect(await token.initialized()).to.equal(true);
  });

  it("should not allow double initialization", async function () {
    await expectRevert(
      token.initialize("X", "X", "", creator.address, owner.address),
      "Already initialized"
    );
  });

  it("should have 1B total supply", async function () {
    expect(await token.totalSupply()).to.equal(ethers.parseEther("1000000000"));
  });

  it("should allow owner to set image URI", async function () {
    await token.setImageURI("https://new.com/image.png");
    expect(await token.imageURI()).to.equal("https://new.com/image.png");
  });

  it("should track trading volume", async function () {
    await token.trackVolume(ethers.parseEther("1000"));
    expect(await token.tradingVolume()).to.equal(ethers.parseEther("1000"));
  });
});

describe("ReferralSystem", function () {
  let referral, memedex, owner, user1, user2, user3;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    const MEMEDEX = await ethers.getContractFactory("MEMEDEX");
    memedex = await MEMEDEX.deploy(owner.address);
    await memedex.waitForDeployment();

    const ReferralSystem = await ethers.getContractFactory("ReferralSystem");
    referral = await ReferralSystem.deploy(memedex.target, owner.address);
    await referral.waitForDeployment();

    await memedex.transfer(referral.target, ethers.parseEther("1000000"));
  });

  it("should generate a non-empty referral code", async function () {
    await referral.connect(user1).generateCode();
    const code = await referral.getCodeString(user1.address);
    expect(code.length).to.equal(8);
  });

  it("should not allow generating a code twice", async function () {
    await referral.connect(user1).generateCode();
    await expectRevert(referral.connect(user1).generateCode(), "Code already generated");
  });

  it("should register referral by code", async function () {
    await referral.connect(user1).generateCode();
    const code = await referral.getCodeString(user1.address);
    await referral.connect(user2).registerReferral(code);
    expect(await referral.referrers(user2.address)).to.equal(user1.address);
    expect(await referral.referralCount(user1.address)).to.equal(1n);
  });

  it("should reject self-referral", async function () {
    await referral.connect(user1).generateCode();
    const code = await referral.getCodeString(user1.address);
    await expectRevert(referral.connect(user1).registerReferral(code), "Cannot refer yourself");
  });

  it("should register referral by address", async function () {
    await referral.connect(user2).registerReferralByAddress(user1.address);
    expect(await referral.referrers(user2.address)).to.equal(user1.address);
  });

  it("should accrue rewards once and pay only on claim (no double-pay)", async function () {
    await referral.connect(user1).generateCode();
    const code = await referral.getCodeString(user1.address);
    await referral.connect(user2).registerReferral(code);

    // purchaseAmount = 1000, reward = 5% = 50
    const purchase = ethers.parseEther("1000");
    await referral.processReferralReward(user2.address, purchase);

    const expectedReward = ethers.parseEther("50");
    // No payout happened yet; the pool balance is unchanged.
    expect(await memedex.balanceOf(referral.target)).to.equal(ethers.parseEther("1000000"));

    const info = await referral.getReferralInfo(user1.address);
    expect(info.pendingEarnings).to.equal(expectedReward);

    const before = await memedex.balanceOf(user1.address);
    await referral.connect(user1).claimEarnings();
    const after = await memedex.balanceOf(user1.address);
    expect(after - before).to.equal(expectedReward);

    // Claiming again must fail (earnings reset to 0).
    await expectRevert(referral.connect(user1).claimEarnings());
  });
});

describe("TradingRewards", function () {
  let rewards, memedex, owner, t1, t2, t3;

  beforeEach(async function () {
    [owner, t1, t2, t3] = await ethers.getSigners();

    const MEMEDEX = await ethers.getContractFactory("MEMEDEX");
    memedex = await MEMEDEX.deploy(owner.address);
    await memedex.waitForDeployment();

    const TradingRewards = await ethers.getContractFactory("TradingRewards");
    rewards = await TradingRewards.deploy(memedex.target, owner.address);
    await rewards.waitForDeployment();

    await memedex.transfer(rewards.target, ethers.parseEther("100000"));
  });

  it("should create a snapshot on first trackVolume call", async function () {
    await rewards.trackVolume(t1.address, ethers.parseEther("1000"));
    expect(await rewards.snapshotCount()).to.equal(1n);
  });

  it("should track volume for different traders in one snapshot", async function () {
    await rewards.trackVolume(t1.address, ethers.parseEther("1000"));
    await rewards.trackVolume(t2.address, ethers.parseEther("500"));
    await rewards.trackVolume(t3.address, ethers.parseEther("300"));
    expect(await rewards.snapshotCount()).to.equal(1n);
    expect(await rewards.getUserVolume(t1.address, 0)).to.equal(ethers.parseEther("1000"));
  });

  it("should pay #1 trader 30% of the pool and prevent double-claim", async function () {
    await rewards.trackVolume(t1.address, ethers.parseEther("1000")); // rank 0
    await rewards.trackVolume(t2.address, ethers.parseEther("500"));  // rank 1
    await rewards.finalizeSnapshot();

    const pool = ethers.parseEther("100000");
    const expected = (pool * 3000n) / 10000n; // 30%

    const claimable = await rewards.getClaimableReward(t1.address, 0);
    expect(claimable).to.equal(expected);

    const before = await memedex.balanceOf(t1.address);
    await rewards.connect(t1).claimRewards(0);
    const after = await memedex.balanceOf(t1.address);
    expect(after - before).to.equal(expected);

    // Second claim must revert.
    await expectRevert(rewards.connect(t1).claimRewards(0), "Already claimed");
    expect(await rewards.hasClaimed(t1.address, 0)).to.equal(true);
  });

  it("should reject claims for non-finalized snapshots", async function () {
    await rewards.trackVolume(t1.address, ethers.parseEther("1000"));
    await expectRevert(rewards.connect(t1).claimRewards(0), "Snapshot not finalized");
  });
});

describe("MemeFactory & MemePair AMM", function () {
  let factory, router, owner, user1, tokenA, tokenB, pair;

  async function addLiquidity(amountA, amountB) {
    await tokenA.transfer(pair.target, amountA);
    await tokenB.transfer(pair.target, amountB);
    await pair.mint(owner.address);
  }

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();

    const MemeFactory = await ethers.getContractFactory("MemeFactory");
    factory = await MemeFactory.deploy(owner.address);
    await factory.waitForDeployment();
    await factory.setProtocolFeeRecipient(owner.address);

    const MemeRouter = await ethers.getContractFactory("MemeRouter");
    router = await MemeRouter.deploy(factory.target);
    await router.waitForDeployment();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    tokenA = await MockERC20.deploy("Token A", "TKA", 18);
    tokenB = await MockERC20.deploy("Token B", "TKB", 18);
    await tokenA.waitForDeployment();
    await tokenB.waitForDeployment();
    await tokenA.mint(owner.address, ethers.parseEther("1000000"));
    await tokenB.mint(owner.address, ethers.parseEther("1000000"));

    await factory.createPair(tokenA.target, tokenB.target);
    const pairAddr = await factory.getPair(tokenA.target, tokenB.target);
    pair = await ethers.getContractAt("MemePair", pairAddr);
  });

  it("should create a pair and track length", async function () {
    expect(await factory.pairLength()).to.equal(1n);
    expect(pair.target).to.not.equal(ethers.ZeroAddress);
  });

  it("should mint LP on first liquidity add", async function () {
    await addLiquidity(ethers.parseEther("1000"), ethers.parseEther("1000"));
    expect(await pair.balanceOf(owner.address) > 0n).to.equal(true);
    const [rA, rB] = await pair.getReserves();
    expect(rA).to.equal(ethers.parseEther("1000"));
    expect(rB).to.equal(ethers.parseEther("1000"));
  });

  it("should swap via router and respect the K invariant", async function () {
    await addLiquidity(ethers.parseEther("10000"), ethers.parseEther("10000"));

    const amountIn = ethers.parseEther("100");
    await tokenA.transfer(user1.address, amountIn);
    await tokenA.connect(user1).approve(router.target, amountIn);

    const path = [tokenA.target, tokenB.target];
    const amountsOut = await router.getAmountsOut(amountIn, path);
    const expectedOut = amountsOut[1];
    expect(expectedOut > 0n).to.equal(true);

    const beforeB = await tokenB.balanceOf(user1.address);
    await router.connect(user1).swapExactTokensForTokens(amountIn, expectedOut, path, user1.address);
    const afterB = await tokenB.balanceOf(user1.address);
    expect(afterB - beforeB).to.equal(expectedOut);
  });

  it("should reject a swap that breaks the K invariant (no free output)", async function () {
    await addLiquidity(ethers.parseEther("10000"), ethers.parseEther("10000"));
    // Try to take output without sending any input.
    await expectRevert(
      pair.connect(user1).swap(ethers.parseEther("100"), 0, user1.address),
      "Insufficient input amount"
    );
  });
});

describe("Presale", function () {
  let presale, token, owner, creator, buyer;

  beforeEach(async function () {
    [owner, creator, buyer] = await ethers.getSigners();
  });

  async function deployPresale(softCap, hardCap) {
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    token = await MockERC20.deploy("Sale", "SALE", 18);
    await token.waitForDeployment();
    await token.mint(owner.address, ethers.parseEther("100000000"));

    const tokensForSale = ethers.parseEther("10000000");
    const now = (await ethers.provider.getBlock("latest")).timestamp;
    const Presale = await ethers.getContractFactory("Presale");

    presale = await Presale.deploy(
      token.target, creator.address, 1000n,
      hardCap, softCap,
      ethers.parseEther("0.01"),
      ethers.parseEther("100"),
      now - 1, now + 3600, 1000n, tokensForSale, owner.address
    );
    await presale.waitForDeployment();
    // The constructor no longer pulls tokens; fund the presale explicitly.
    await token.transfer(presale.target, tokensForSale);
    expect(await presale.isFunded()).to.equal(true);
    return presale;
  }

  it("should refund buyers when the presale is cancelled (soft cap not met)", async function () {
    await deployPresale(ethers.parseEther("50"), ethers.parseEther("100"));

    // Buyer contributes below soft cap.
    await presale.connect(buyer).buyTokens(ethers.ZeroAddress, { value: ethers.parseEther("10") });

    // Finalize -> cancels because soft cap not met.
    await presale.finalize();
    const infoAfter = await presale.getPresaleInfo();
    expect(infoAfter.isCancelled).to.equal(true);

    // Buyer refunds their OPN.
    const before = await ethers.provider.getBalance(buyer.address);
    const tx = await presale.connect(buyer).refund();
    const rc = await tx.wait();
    const gas = rc.gasUsed * rc.gasPrice;
    const after = await ethers.provider.getBalance(buyer.address);
    expect(after + gas - before).to.equal(ethers.parseEther("10"));
  });

  it("should let the creator withdraw raised funds after a successful presale", async function () {
    await deployPresale(ethers.parseEther("5"), ethers.parseEther("100"));

    await presale.connect(buyer).buyTokens(ethers.ZeroAddress, { value: ethers.parseEther("10") });
    await presale.finalize();

    const info = await presale.getPresaleInfo();
    expect(info.isFinalized).to.equal(true);
    expect(info.isCancelled).to.equal(false);

    const before = await ethers.provider.getBalance(creator.address);
    await presale.withdrawFunds(); // called by owner
    const after = await ethers.provider.getBalance(creator.address);
    expect(after - before).to.equal(ethers.parseEther("10"));
  });
});

describe("PresaleFactory", function () {
  let factory, token, owner, creator, buyer;

  beforeEach(async function () {
    [owner, creator, buyer] = await ethers.getSigners();

    const PresaleFactory = await ethers.getContractFactory("PresaleFactory");
    factory = await PresaleFactory.deploy(owner.address);
    await factory.waitForDeployment();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    token = await MockERC20.deploy("Sale", "SALE", 18);
    await token.waitForDeployment();
    await token.mint(creator.address, ethers.parseEther("100000000"));
  });

  async function createViaFactory() {
    const tokensForSale = ethers.parseEther("10000000");
    const now = (await ethers.provider.getBlock("latest")).timestamp;
    await token.connect(creator).approve(factory.target, tokensForSale);

    const params = {
      token: token.target,
      rate: 1000n,
      hardCap: ethers.parseEther("100"),
      softCap: ethers.parseEther("5"),
      minPurchase: ethers.parseEther("0.01"),
      maxPurchase: ethers.parseEther("100"),
      startTime: now - 1,
      endTime: now + 3600,
      listingRate: 1000n,
      tokensForSale,
      name: "Wojak",
      symbol: "WOJAK",
      imageURI: "https://img/wojak.png",
      description: "The legendary wojak",
    };
    await factory.connect(creator).createPresale(params);
  }

  it("should create and fund a presale, and register it", async function () {
    await createViaFactory();
    expect(await factory.presaleCount()).to.equal(1n);

    const metas = await factory.getPresales(0, 10);
    expect(metas.length).to.equal(1);
    expect(metas[0].symbol).to.equal("WOJAK");
    expect(metas[0].creator).to.equal(creator.address);

    const presale = await ethers.getContractAt("Presale", metas[0].presale);
    expect(await presale.isFunded()).to.equal(true);

    const info = await presale.getFullInfo();
    expect(info.creator).to.equal(creator.address);
    expect(info.hardCap).to.equal(ethers.parseEther("100"));
  });

  it("should let a buyer purchase through a factory-created presale", async function () {
    await createViaFactory();
    const metas = await factory.getPresales(0, 10);
    const presale = await ethers.getContractAt("Presale", metas[0].presale);

    await presale.connect(buyer).buyTokens(ethers.ZeroAddress, { value: ethers.parseEther("2") });
    const pos = await presale.getUserPosition(buyer.address);
    expect(pos.contributed).to.equal(ethers.parseEther("2"));
    expect(pos.tokensBought).to.equal(ethers.parseEther("2") * 1000n);
  });

  it("should track creator presales", async function () {
    await createViaFactory();
    const ids = await factory.getCreatorPresales(creator.address);
    expect(ids.length).to.equal(1);
    expect(ids[0]).to.equal(0n);
  });
});
