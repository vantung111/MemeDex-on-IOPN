// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MasterChef is Ownable, ReentrancyGuard {
    struct UserInfo {
        uint256 amount;
        uint256 rewardDebt;
        uint256 lastClaimBlock;
    }

    struct PoolInfo {
        IERC20 lpToken;        // address(0) for native pools
        uint256 allocPoint;
        uint256 lastRewardBlock;
        uint256 accRewardPerShare;
        bool isNative;
        uint256 totalStaked;   // tracked stake (works for both native & ERC20)
    }

    IERC20 public rewardToken;
    uint256 public rewardPerBlock = 10 ether;
    uint256 public constant BONUS_MULTIPLIER = 1;

    PoolInfo[] public poolInfo;
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    mapping(IERC20 => bool) public addedPools;

    uint256 public totalAllocPoint = 0;
    uint256 public startBlock;

    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event SetRewardPerBlock(uint256 indexed newAmount);

    constructor(address _rewardToken, uint256 _startBlock, address initialOwner) Ownable(initialOwner) {
        rewardToken = IERC20(_rewardToken);
        startBlock = _startBlock;
    }

    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    function addPool(uint256 _allocPoint, IERC20 _lpToken, bool _isNative, bool _withUpdate) external onlyOwner {
        if (!_isNative) {
            require(!addedPools[_lpToken], "Pool already added");
            addedPools[_lpToken] = true;
        }
        if (_withUpdate) { massUpdatePools(); }
        uint256 lastRewardBlock = block.number > startBlock ? block.number : startBlock;
        totalAllocPoint += _allocPoint;
        poolInfo.push(PoolInfo({
            lpToken: _lpToken,
            allocPoint: _allocPoint,
            lastRewardBlock: lastRewardBlock,
            accRewardPerShare: 0,
            isNative: _isNative,
            totalStaked: 0
        }));
    }

    function setPool(uint256 _pid, uint256 _allocPoint, bool _withUpdate) external onlyOwner {
        if (_withUpdate) { massUpdatePools(); }
        totalAllocPoint = totalAllocPoint - poolInfo[_pid].allocPoint + _allocPoint;
        poolInfo[_pid].allocPoint = _allocPoint;
    }

    function setRewardPerBlock(uint256 _rewardPerBlock) external onlyOwner {
        massUpdatePools();
        rewardPerBlock = _rewardPerBlock;
        emit SetRewardPerBlock(_rewardPerBlock);
    }

    function pendingReward(uint256 _pid, address _user) external view returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accRewardPerShare = pool.accRewardPerShare;
        uint256 lpSupply = pool.totalStaked;
        if (block.number > pool.lastRewardBlock && lpSupply != 0 && totalAllocPoint != 0) {
            uint256 reward = (block.number - pool.lastRewardBlock) * BONUS_MULTIPLIER * rewardPerBlock * pool.allocPoint / totalAllocPoint;
            accRewardPerShare += reward * 1e12 / lpSupply;
        }
        return user.amount * accRewardPerShare / 1e12 - user.rewardDebt;
    }

    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.number <= pool.lastRewardBlock) { return; }
        uint256 lpSupply = pool.totalStaked;
        if (lpSupply == 0 || totalAllocPoint == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        uint256 reward = (block.number - pool.lastRewardBlock) * BONUS_MULTIPLIER * rewardPerBlock * pool.allocPoint / totalAllocPoint;
        pool.accRewardPerShare += reward * 1e12 / lpSupply;
        pool.lastRewardBlock = block.number;
    }

    /// @notice Deposit LP tokens (ERC20 pools). For native pools use depositNative().
    function deposit(uint256 _pid, uint256 _amount) external nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        require(!pool.isNative, "Use depositNative");
        UserInfo storage user = userInfo[_pid][msg.sender];
        updatePool(_pid);
        if (user.amount > 0) {
            uint256 pending = user.amount * pool.accRewardPerShare / 1e12 - user.rewardDebt;
            if (pending > 0) {
                safeRewardTransfer(msg.sender, pending);
            }
        }
        if (_amount > 0) {
            require(pool.lpToken.transferFrom(address(msg.sender), address(this), _amount), "transferFrom failed");
            user.amount += _amount;
            pool.totalStaked += _amount;
        }
        user.rewardDebt = user.amount * pool.accRewardPerShare / 1e12;
        user.lastClaimBlock = block.number;
        emit Deposit(msg.sender, _pid, _amount);
    }

    /// @notice Stake native OPN into a native pool (e.g. pool 0).
    function depositNative(uint256 _pid) external payable nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        require(pool.isNative, "Not native pool");
        UserInfo storage user = userInfo[_pid][msg.sender];
        updatePool(_pid);
        if (user.amount > 0) {
            uint256 pending = user.amount * pool.accRewardPerShare / 1e12 - user.rewardDebt;
            if (pending > 0) {
                safeRewardTransfer(msg.sender, pending);
            }
        }
        if (msg.value > 0) {
            user.amount += msg.value;
            pool.totalStaked += msg.value;
        }
        user.rewardDebt = user.amount * pool.accRewardPerShare / 1e12;
        user.lastClaimBlock = block.number;
        emit Deposit(msg.sender, _pid, msg.value);
    }

    function withdraw(uint256 _pid, uint256 _amount) external nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.amount >= _amount, "Insufficient balance");
        updatePool(_pid);
        uint256 pending = user.amount * pool.accRewardPerShare / 1e12 - user.rewardDebt;
        if (pending > 0) {
            safeRewardTransfer(msg.sender, pending);
        }
        user.amount -= _amount;
        pool.totalStaked -= _amount;
        user.rewardDebt = user.amount * pool.accRewardPerShare / 1e12;
        if (_amount > 0) {
            if (pool.isNative) {
                (bool ok,) = msg.sender.call{value: _amount}("");
                require(ok, "Native transfer failed");
            } else {
                require(pool.lpToken.transfer(address(msg.sender), _amount), "transfer failed");
            }
        }
        emit Withdraw(msg.sender, _pid, _amount);
    }

    function emergencyWithdraw(uint256 _pid) external nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        uint256 amount = user.amount;
        user.amount = 0;
        user.rewardDebt = 0;
        if (pool.totalStaked >= amount) {
            pool.totalStaked -= amount;
        } else {
            pool.totalStaked = 0;
        }
        if (amount > 0) {
            if (pool.isNative) {
                (bool ok,) = msg.sender.call{value: amount}("");
                require(ok, "Native transfer failed");
            } else {
                require(pool.lpToken.transfer(address(msg.sender), amount), "transfer failed");
            }
        }
        emit EmergencyWithdraw(msg.sender, _pid, amount);
    }

    function safeRewardTransfer(address _to, uint256 _amount) internal {
        uint256 rewardBal = rewardToken.balanceOf(address(this));
        if (_amount > rewardBal) {
            rewardToken.transfer(_to, rewardBal);
        } else {
            rewardToken.transfer(_to, _amount);
        }
    }

    function getPoolInfo(uint256 _pid) external view returns (
        address lpToken, uint256 allocPoint, uint256 lastRewardBlock,
        uint256 accRewardPerShare, bool isNative, uint256 lpBalance
    ) {
        PoolInfo storage pool = poolInfo[_pid];
        return (
            address(pool.lpToken),
            pool.allocPoint,
            pool.lastRewardBlock,
            pool.accRewardPerShare,
            pool.isNative,
            pool.totalStaked
        );
    }
}
