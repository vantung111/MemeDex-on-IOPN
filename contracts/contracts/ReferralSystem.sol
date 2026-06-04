// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title ReferralSystem
/// @notice Tracks referrals via short, human-friendly string codes and accrues
///         MEMEDEX rewards for referrers. Rewards are accrued on-chain and the
///         referrer withdraws them via claimEarnings().
contract ReferralSystem is Ownable, ReentrancyGuard {
    IERC20 public rewardToken;
    uint256 public constant REWARD_RATE = 500; // 5% in basis points
    uint256 public constant TOTAL_REWARD_POOL = 1_000_000 ether; // 1M MEMEDEX

    mapping(address => address) public referrers;        // referee -> referrer
    mapping(address => uint256) public referralCount;    // referrer -> count
    mapping(address => uint256) public referralEarnings; // referrer -> claimable (pending)
    mapping(address => uint256) public totalEarned;      // referrer -> lifetime earned
    mapping(string => address) public codeToAddress;     // code -> owner
    mapping(address => string) public addressToCode;     // owner -> code

    uint256 public totalRewardsDistributed;

    event ReferralRegistered(address indexed referee, address indexed referrer, string code);
    event ReferralReward(address indexed referrer, address indexed referee, uint256 reward);
    event ReferralCodeGenerated(address indexed user, string code);
    event EarningsClaimed(address indexed user, uint256 amount);

    constructor(address _rewardToken, address initialOwner) Ownable(initialOwner) {
        rewardToken = IERC20(_rewardToken);
    }

    /// @notice Generate a unique 8-character code derived from the caller.
    function generateCode() external returns (string memory) {
        require(bytes(addressToCode[msg.sender]).length == 0, "Code already generated");
        string memory code = _generateUniqueCode(msg.sender);
        codeToAddress[code] = msg.sender;
        addressToCode[msg.sender] = code;
        emit ReferralCodeGenerated(msg.sender, code);
        return code;
    }

    function getCodeString(address user) external view returns (string memory) {
        return addressToCode[user];
    }

    /// @notice Register the caller as a referee of the owner of `code`.
    function registerReferral(string calldata code) external {
        require(referrers[msg.sender] == address(0), "Already registered");
        require(bytes(code).length > 0, "Invalid code");
        address referrer = codeToAddress[code];
        require(referrer != address(0), "Invalid code");
        require(referrer != msg.sender, "Cannot refer yourself");

        referrers[msg.sender] = referrer;
        referralCount[referrer] += 1;
        emit ReferralRegistered(msg.sender, referrer, code);
    }

    /// @notice Register a referee against a referrer address directly (no code).
    function registerReferralByAddress(address referrer) external {
        require(referrers[msg.sender] == address(0), "Already registered");
        require(referrer != address(0), "Invalid referrer");
        require(referrer != msg.sender, "Cannot refer yourself");

        referrers[msg.sender] = referrer;
        referralCount[referrer] += 1;
        emit ReferralRegistered(msg.sender, referrer, addressToCode[referrer]);
    }

    /// @notice Accrue a referral reward for the referee's referrer.
    /// @dev Accrues only; the referrer withdraws via claimEarnings(). This avoids
    ///      paying twice (once here and once on claim).
    function processReferralReward(address referee, uint256 purchaseAmount) external {
        address referrer = referrers[referee];
        if (referrer == address(0)) return;

        uint256 reward = (purchaseAmount * REWARD_RATE) / 10000;
        if (totalRewardsDistributed + reward > TOTAL_REWARD_POOL) {
            reward = TOTAL_REWARD_POOL - totalRewardsDistributed;
        }
        if (reward == 0) return;

        totalRewardsDistributed += reward;
        referralEarnings[referrer] += reward;
        totalEarned[referrer] += reward;
        emit ReferralReward(referrer, referee, reward);
    }

    function claimEarnings() external nonReentrant {
        uint256 earnings = referralEarnings[msg.sender];
        require(earnings > 0, "No earnings");
        referralEarnings[msg.sender] = 0;
        require(rewardToken.transfer(msg.sender, earnings), "Transfer failed");
        emit EarningsClaimed(msg.sender, earnings);
    }

    function getReferralInfo(address user) external view returns (
        uint256 totalReferrals,
        uint256 lifetimeEarnings,
        uint256 pendingEarnings,
        string memory code
    ) {
        return (
            referralCount[user],
            totalEarned[user],
            referralEarnings[user],
            addressToCode[user]
        );
    }

    /// @dev Produces a base32-ish 8-char code from the address + salt, ensuring
    ///      uniqueness by incrementing a nonce until a free code is found.
    function _generateUniqueCode(address user) internal view returns (string memory) {
        bytes memory alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 32 chars, no ambiguous 0/O/1/I
        for (uint256 nonce = 0; nonce < 1000; nonce++) {
            bytes32 h = keccak256(abi.encodePacked(user, address(this), nonce));
            bytes memory out = new bytes(8);
            for (uint256 i = 0; i < 8; i++) {
                out[i] = alphabet[uint8(h[i]) & 0x1f];
            }
            string memory candidate = string(out);
            if (codeToAddress[candidate] == address(0)) {
                return candidate;
            }
        }
        revert("Could not generate code");
    }
}
