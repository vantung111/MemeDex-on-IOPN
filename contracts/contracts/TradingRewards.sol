// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract TradingRewards is Ownable, ReentrancyGuard {
    IERC20 public rewardToken;

    struct Snapshot {
        uint256 timestamp;
        mapping(address => uint256) volume;
        mapping(address => bool) claimed;
        address[] traders;
        bool isFinalized;
        uint256 rewardPool; // snapshotted reward budget captured at finalize
    }

    uint256 public constant SNAPSHOT_INTERVAL = 7 days;
    uint256 public constant TOP_TRADERS_COUNT = 20;
    uint256[] public topRewards = [
        3000,  // #1: 30%
        1500, 1500, 1500, 1500,  // #2-5: 15% each
        500, 500, 500, 500, 500,  // #6-10: 5% each
        200, 200, 200, 200, 200, 200, 200, 200, 200, 200  // #11-20: 2% each
    ]; // total: 10000 (basis points)

    Snapshot[] public snapshots;
    mapping(address => uint256) public claimedRewards; // lifetime claimed per user

    /// @notice Portion of the contract balance allocated to each finalized
    ///         snapshot's reward pool, in basis points (default 100%).
    uint256 public poolBps = 10000;

    event VolumeTracked(address indexed trader, uint256 amount, uint256 snapshotId);
    event SnapshotCreated(uint256 indexed snapshotId, uint256 timestamp);
    event SnapshotFinalized(uint256 indexed snapshotId, uint256 rewardPool);
    event RewardClaimed(address indexed user, uint256 indexed snapshotId, uint256 amount);

    constructor(address _rewardToken, address initialOwner) Ownable(initialOwner) {
        rewardToken = IERC20(_rewardToken);
    }

    function setPoolBps(uint256 _poolBps) external onlyOwner {
        require(_poolBps <= 10000, "Invalid bps");
        poolBps = _poolBps;
    }

    function trackVolume(address trader, uint256 volume) external {
        require(volume > 0, "Zero volume");
        if (snapshots.length == 0 || snapshots[snapshots.length - 1].isFinalized) {
            _createSnapshot();
        }

        Snapshot storage snap = snapshots[snapshots.length - 1];
        if (snap.volume[trader] == 0) {
            snap.traders.push(trader);
        }
        snap.volume[trader] += volume;

        emit VolumeTracked(trader, volume, snapshots.length - 1);
    }

    function _createSnapshot() internal {
        snapshots.push();
        snapshots[snapshots.length - 1].timestamp = block.timestamp;
        emit SnapshotCreated(snapshots.length - 1, block.timestamp);
    }

    function finalizeSnapshot() external onlyOwner {
        require(snapshots.length > 0, "No snapshot");
        Snapshot storage snap = snapshots[snapshots.length - 1];
        require(!snap.isFinalized, "Already finalized");
        snap.isFinalized = true;
        // Capture the reward budget for this snapshot at finalize time so that
        // distribution is deterministic regardless of claim order.
        snap.rewardPool = (rewardToken.balanceOf(address(this)) * poolBps) / 10000;
        emit SnapshotFinalized(snapshots.length - 1, snap.rewardPool);
    }

    function getSnapshotLeaderboard(uint256 snapshotId) external view returns (address[] memory, uint256[] memory) {
        Snapshot storage snap = snapshots[snapshotId];
        uint256 tradersCount = snap.traders.length;

        address[] memory sortedTraders = new address[](tradersCount);
        uint256[] memory volumes = new uint256[](tradersCount);

        for (uint256 i = 0; i < tradersCount; i++) {
            sortedTraders[i] = snap.traders[i];
            volumes[i] = snap.volume[snap.traders[i]];
        }

        // Simple selection sort for small arrays (descending by volume)
        for (uint256 i = 0; i < tradersCount; i++) {
            for (uint256 j = i + 1; j < tradersCount; j++) {
                if (volumes[j] > volumes[i]) {
                    (sortedTraders[i], sortedTraders[j]) = (sortedTraders[j], sortedTraders[i]);
                    (volumes[i], volumes[j]) = (volumes[j], volumes[i]);
                }
            }
        }

        return (sortedTraders, volumes);
    }

    function _rankOf(Snapshot storage snap, address user) internal view returns (uint256 rank) {
        uint256 userVolume = snap.volume[user];
        uint256 tradersCount = snap.traders.length;
        for (uint256 i = 0; i < tradersCount; i++) {
            if (snap.volume[snap.traders[i]] > userVolume) rank++;
        }
    }

    function claimRewards(uint256 snapshotId) external nonReentrant {
        Snapshot storage snap = snapshots[snapshotId];
        require(snap.isFinalized, "Snapshot not finalized");
        require(!snap.claimed[msg.sender], "Already claimed");

        uint256 userVolume = snap.volume[msg.sender];
        require(userVolume > 0, "No volume in snapshot");

        uint256 rank = _rankOf(snap, msg.sender);
        require(rank < TOP_TRADERS_COUNT, "Not in top 20");

        uint256 reward = (snap.rewardPool * topRewards[rank]) / 10000;
        require(reward > 0, "No reward");

        snap.claimed[msg.sender] = true;
        claimedRewards[msg.sender] += reward;
        require(rewardToken.transfer(msg.sender, reward), "Transfer failed");

        emit RewardClaimed(msg.sender, snapshotId, reward);
    }

    function getClaimableReward(address user, uint256 snapshotId) external view returns (uint256) {
        if (snapshotId >= snapshots.length) return 0;
        Snapshot storage snap = snapshots[snapshotId];
        if (!snap.isFinalized) return 0;
        if (snap.claimed[user]) return 0;
        if (snap.volume[user] == 0) return 0;

        uint256 rank = _rankOf(snap, user);
        if (rank >= TOP_TRADERS_COUNT) return 0;

        return (snap.rewardPool * topRewards[rank]) / 10000;
    }

    function hasClaimed(address user, uint256 snapshotId) external view returns (bool) {
        if (snapshotId >= snapshots.length) return false;
        return snapshots[snapshotId].claimed[user];
    }

    function getUserVolume(address user, uint256 snapshotId) external view returns (uint256) {
        if (snapshotId >= snapshots.length) return 0;
        return snapshots[snapshotId].volume[user];
    }

    function snapshotCount() external view returns (uint256) {
        return snapshots.length;
    }
}
