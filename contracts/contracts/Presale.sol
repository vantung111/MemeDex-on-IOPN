// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IMemeToken {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function totalSupply() external view returns (uint256);
}

contract Presale is Ownable, ReentrancyGuard {
    struct PresaleInfo {
        address token;
        address creator;
        uint256 rate;              // tokens per OPN
        uint256 hardCap;
        uint256 softCap;
        uint256 minPurchase;
        uint256 maxPurchase;
        uint256 startTime;
        uint256 endTime;
        uint256 totalRaised;
        uint256 listingRate;        // rate on DEX listing
        bool isFinalized;
        bool isCancelled;
        uint256 tokensForSale;
    }

    struct UserInfo {
        uint256 amount;
        uint256 tokensBought;
        uint256 tokensClaimed;
        bool hasWhitelisted;
    }

    PresaleInfo public info;
    mapping(address => UserInfo) public userInfo;
    mapping(address => bool) public whitelist;

    uint256 public constant VESTING_PERIOD = 30 days;
    uint256 public constant TGE_RELEASE = 50;

    bool public fundsWithdrawn;

    event TokensPurchased(address indexed buyer, uint256 opnAmount, uint256 tokenAmount);
    event TokensClaimed(address indexed user, uint256 amount);
    event PresaleFinalized(address indexed finalizer, uint256 totalRaised, uint256 tokensSold);
    event PresaleCancelled();
    event Refunded(address indexed user, uint256 amount);
    event FundsWithdrawn(address indexed creator, uint256 amount);

    modifier onlyActive() {
        require(!info.isFinalized && !info.isCancelled, "Not active");
        require(block.timestamp >= info.startTime && block.timestamp <= info.endTime, "Not in presale window");
        _;
    }

    constructor(
        address _token,
        address _creator,
        uint256 _rate,
        uint256 _hardCap,
        uint256 _softCap,
        uint256 _minPurchase,
        uint256 _maxPurchase,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _listingRate,
        uint256 _tokensForSale,
        address initialOwner
    ) Ownable(initialOwner) {
        info = PresaleInfo({
            token: _token,
            creator: _creator,
            rate: _rate,
            hardCap: _hardCap,
            softCap: _softCap,
            minPurchase: _minPurchase,
            maxPurchase: _maxPurchase,
            startTime: _startTime,
            endTime: _endTime,
            totalRaised: 0,
            listingRate: _listingRate,
            isFinalized: false,
            isCancelled: false,
            tokensForSale: _tokensForSale
        });
        // The sale tokens are funded after deployment (e.g. by PresaleFactory),
        // so this constructor intentionally does not pull tokens.
    }

    /// @notice True once the contract holds at least `tokensForSale` tokens.
    function isFunded() public view returns (bool) {
        return IMemeToken(info.token).balanceOf(address(this)) >= info.tokensForSale;
    }

    function setWhitelist(address[] calldata users, bool status) external onlyOwner {
        for (uint256 i = 0; i < users.length; i++) {
            whitelist[users[i]] = status;
            userInfo[users[i]].hasWhitelisted = status;
        }
    }

    function buyTokens(address /* referrer */) external payable onlyActive nonReentrant {
        require(msg.value >= info.minPurchase, "Below min purchase");
        require(msg.value <= info.maxPurchase, "Above max purchase");
        require(info.totalRaised + msg.value <= info.hardCap, "Hard cap reached");

        uint256 tokenAmount = msg.value * info.rate;
        require(IMemeToken(info.token).balanceOf(address(this)) >= tokenAmount, "Insufficient tokens");

        UserInfo storage user = userInfo[msg.sender];
        user.amount += msg.value;
        user.tokensBought += tokenAmount;
        info.totalRaised += msg.value;

        emit TokensPurchased(msg.sender, msg.value, tokenAmount);
    }

    function claimTokens() external nonReentrant {
        require(info.isFinalized, "Not finalized");
        UserInfo storage user = userInfo[msg.sender];
        require(user.tokensBought > 0, "No tokens to claim");

        uint256 totalVesting = user.tokensBought;
        uint256 tgeAmount = (totalVesting * TGE_RELEASE) / 100;
        uint256 timeSinceEnd = block.timestamp > info.endTime ? block.timestamp - info.endTime : 0;
        uint256 vestedAmount = timeSinceEnd >= VESTING_PERIOD
            ? totalVesting
            : tgeAmount + (totalVesting - tgeAmount) * timeSinceEnd / VESTING_PERIOD;

        uint256 claimable = vestedAmount - user.tokensClaimed;
        require(claimable > 0, "Nothing to claim");

        user.tokensClaimed += claimable;
        require(IMemeToken(info.token).transfer(msg.sender, claimable), "Transfer failed");

        emit TokensClaimed(msg.sender, claimable);
    }

    function finalize() external onlyOwner {
        require(!info.isFinalized && !info.isCancelled, "Already processed");

        if (info.totalRaised < info.softCap) {
            // Soft cap not met: cancel and enable buyer refunds.
            info.isCancelled = true;
            // Return unsold/all tokens to creator
            uint256 remaining = IMemeToken(info.token).balanceOf(address(this));
            if (remaining > 0) {
                IMemeToken(info.token).transfer(info.creator, remaining);
            }
            emit PresaleCancelled();
        } else {
            // Soft cap met: presale succeeds, token claims unlock via claimTokens().
            info.isFinalized = true;
        }
        emit PresaleFinalized(msg.sender, info.totalRaised, info.tokensForSale);
    }

    /// @notice Owner cancels the presale outright, enabling refunds for buyers.
    function cancel() external onlyOwner {
        require(!info.isFinalized && !info.isCancelled, "Already processed");
        info.isCancelled = true;
        uint256 remaining = IMemeToken(info.token).balanceOf(address(this));
        if (remaining > 0) {
            IMemeToken(info.token).transfer(info.creator, remaining);
        }
        emit PresaleCancelled();
    }

    /// @notice Refund a buyer's contributed OPN if the presale was cancelled.
    function refund() external nonReentrant {
        require(info.isCancelled, "Not cancelled");
        UserInfo storage user = userInfo[msg.sender];
        uint256 amount = user.amount;
        require(amount > 0, "Nothing to refund");

        user.amount = 0;
        user.tokensBought = 0;
        (bool success,) = msg.sender.call{value: amount}("");
        require(success, "Refund failed");
        emit Refunded(msg.sender, amount);
    }

    /// @notice After a successful presale, the creator withdraws the raised OPN.
    function withdrawFunds() external nonReentrant {
        require(info.isFinalized && !info.isCancelled, "Not finalized");
        require(msg.sender == info.creator || msg.sender == owner(), "Not authorized");
        require(!fundsWithdrawn, "Already withdrawn");

        fundsWithdrawn = true;
        uint256 amount = address(this).balance;
        require(amount > 0, "No funds");
        (bool success,) = info.creator.call{value: amount}("");
        require(success, "Withdraw failed");
        emit FundsWithdrawn(info.creator, amount);
    }

    function getPresaleInfo() external view returns (
        address token,
        address creator,
        uint256 rate,
        uint256 hardCap,
        uint256 softCap,
        uint256 totalRaised,
        bool isFinalized,
        bool isCancelled,
        uint256 tokensRemaining
    ) {
        return (
            info.token,
            info.creator,
            info.rate,
            info.hardCap,
            info.softCap,
            info.totalRaised,
            info.isFinalized,
            info.isCancelled,
            IMemeToken(info.token).balanceOf(address(this))
        );
    }

    /// @notice Full presale state for the frontend in a single call.
    function getFullInfo() external view returns (
        address token,
        address creator,
        uint256 rate,
        uint256 hardCap,
        uint256 softCap,
        uint256 minPurchase,
        uint256 maxPurchase,
        uint256 startTime,
        uint256 endTime,
        uint256 totalRaised,
        bool isFinalized,
        bool isCancelled
    ) {
        return (
            info.token,
            info.creator,
            info.rate,
            info.hardCap,
            info.softCap,
            info.minPurchase,
            info.maxPurchase,
            info.startTime,
            info.endTime,
            info.totalRaised,
            info.isFinalized,
            info.isCancelled
        );
    }

    /// @notice A user's contribution and claim position.
    function getUserPosition(address user) external view returns (
        uint256 contributed,
        uint256 tokensBought,
        uint256 tokensClaimed
    ) {
        UserInfo storage u = userInfo[user];
        return (u.amount, u.tokensBought, u.tokensClaimed);
    }
}
