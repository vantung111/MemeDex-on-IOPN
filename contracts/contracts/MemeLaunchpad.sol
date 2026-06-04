// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./MemeToken.sol";

contract MemeLaunchpad is Ownable, ReentrancyGuard {
    uint256 public constant CREATION_FEE = 2 ether;

    address public factory;
    uint256 public collectedFees;

    LaunchRequest[] public launches;
    mapping(address => uint256[]) public creatorLaunches;
    mapping(address => bool) public isLaunch;

    event LaunchCreated(
        address indexed creator,
        address indexed token,
        uint256 launchId,
        string name,
        string symbol
    );

    struct LaunchRequest {
        string name;
        string symbol;
        string imageURI;
        string description;
        uint256 initialLiquidity;
        uint256 presaleRate;
        uint256 presaleHardCap;
        uint256 presaleSoftCap;
        uint256 presaleDuration;
        uint256 presaleMinPurchase;
        uint256 presaleMaxPurchase;
        uint256 listingRate;
        address creator;
        address token;
        bool isActive;
    }

    constructor(address _factory, address initialOwner) Ownable(initialOwner) {
        factory = _factory;
    }

    function createLaunch(
        string calldata _name,
        string calldata _symbol,
        string calldata _imageURI,
        string calldata _description,
        uint256 _initialLiquidity,
        uint256 _presaleRate,
        uint256 _presaleHardCap,
        uint256 _presaleSoftCap,
        uint256 _presaleDuration,
        uint256 _presaleMinPurchase,
        uint256 _presaleMaxPurchase,
        uint256 _listingRate
    ) external payable nonReentrant returns (uint256 launchId) {
        require(msg.value >= CREATION_FEE, "Insufficient creation fee");
        require(bytes(_name).length > 0 && bytes(_symbol).length > 0, "Name/symbol required");
        require(_initialLiquidity >= 10 ether, "Min 10 OPN liquidity");

        // Deploy new meme token; launchpad is the temporary owner/holder so it
        // can distribute the supply, then ownership is handed to the creator.
        MemeToken newToken = new MemeToken();
        newToken.initialize(_name, _symbol, _imageURI, msg.sender, address(this));

        uint256 tokensForSale = 500_000_000 ether; // 50% of 1B supply
        // Remaining 50% goes to the creator to seed liquidity / treasury.
        uint256 creatorTokens = newToken.balanceOf(address(this)) - tokensForSale;
        if (creatorTokens > 0) {
            newToken.transfer(msg.sender, creatorTokens);
        }
        // Hand control of the token to the creator.
        newToken.transferOwnership(msg.sender);

        launches.push(LaunchRequest({
            name: _name,
            symbol: _symbol,
            imageURI: _imageURI,
            description: _description,
            initialLiquidity: _initialLiquidity,
            presaleRate: _presaleRate,
            presaleHardCap: _presaleHardCap,
            presaleSoftCap: _presaleSoftCap,
            presaleDuration: _presaleDuration,
            presaleMinPurchase: _presaleMinPurchase,
            presaleMaxPurchase: _presaleMaxPurchase,
            listingRate: _listingRate,
            creator: msg.sender,
            token: address(newToken),
            isActive: true
        }));

        launchId = launches.length - 1;
        isLaunch[address(newToken)] = true;
        creatorLaunches[msg.sender].push(launchId);

        // Account for the creation fee so the owner can withdraw it.
        collectedFees += CREATION_FEE;

        // Refund excess fee
        if (msg.value > CREATION_FEE) {
            (bool success,) = msg.sender.call{value: msg.value - CREATION_FEE}("");
            require(success, "Refund failed");
        }

        emit LaunchCreated(msg.sender, address(newToken), launchId, _name, _symbol);
    }

    /// @notice Owner withdraws the accumulated creation fees.
    function withdrawFees(address to) external onlyOwner nonReentrant {
        require(to != address(0), "Invalid recipient");
        uint256 amount = collectedFees;
        require(amount > 0, "No fees");
        collectedFees = 0;
        (bool success,) = to.call{value: amount}("");
        require(success, "Withdraw failed");
    }

    function getLaunchCount() external view returns (uint256) {
        return launches.length;
    }

    function getActiveLaunches() external view returns (LaunchRequest[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < launches.length; i++) {
            if (launches[i].isActive) count++;
        }
        LaunchRequest[] memory active = new LaunchRequest[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < launches.length; i++) {
            if (launches[i].isActive) {
                active[idx++] = launches[i];
            }
        }
        return active;
    }

    function getCreatorLaunches(address creatorAddr) external view returns (uint256[] memory) {
        return creatorLaunches[creatorAddr];
    }

    function cancelLaunch(uint256 launchId) external {
        require(launchId < launches.length, "Invalid launch");
        LaunchRequest storage launch = launches[launchId];
        require(msg.sender == launch.creator, "Not creator");
        launch.isActive = false;
    }
}
