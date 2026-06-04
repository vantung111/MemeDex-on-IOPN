// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IMemeToken {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function creator() external view returns (address);
}

interface IMasterChef {
    function pendingReward(uint256 pid, address user) external view returns (uint256);
    function deposit(uint256 pid, uint256 amount) external;
    function withdraw(uint256 pid, uint256 amount) external;
}

contract MemePair is ERC20, ReentrancyGuard {
    address public tokenA;
    address public tokenB;
    uint256 public reserveA;
    uint256 public reserveB;
    uint256 public constant FEE_NUMERATOR = 9975; // 0.25% fee (from 10000)
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public constant PROTOCOL_FEE = 167; // 0.05% of 0.25% = protocol fee

    address public factory;
    address public protocolFeeRecipient;

    uint256 private unlocked = 1;
    modifier lock() {
        require(unlocked == 1, "MemePair: LOCKED");
        unlocked = 0;
        _;
        unlocked = 1;
    }

    event Mint(address indexed sender, uint256 amountA, uint256 amountB);
    event Burn(address indexed sender, uint256 amountA, uint256 amountB, address indexed to);
    event Swap(address indexed sender, uint256 amountAIn, uint256 amountBIn, uint256 amountAOut, uint256 amountBOut, address indexed to);

    address private constant MINIMUM_LIQUIDITY_ADDRESS = address(0x000000000000000000000000000000000000dEaD);

    constructor() ERC20("Meme LP", "MLP") {
        factory = msg.sender;
    }

    function initialize(address _tokenA, address _tokenB, address _protocolFeeRecipient) external {
        require(msg.sender == factory, "Not factory");
        tokenA = _tokenA;
        tokenB = _tokenB;
        protocolFeeRecipient = _protocolFeeRecipient;
    }

    function getReserves() public view returns (uint256, uint256) {
        return (reserveA, reserveB);
    }

    function _update(uint256 balanceA, uint256 balanceB) internal {
        reserveA = balanceA;
        reserveB = balanceB;
    }

    function mint(address to) external lock nonReentrant returns (uint256 liquidity) {
        (uint256 _reserveA, uint256 _reserveB) = getReserves();
        uint256 balanceA = IERC20(tokenA).balanceOf(address(this));
        uint256 balanceB = IERC20(tokenB).balanceOf(address(this));
        uint256 amountA = balanceA - _reserveA;
        uint256 amountB = balanceB - _reserveB;

        if (totalSupply() == 0) {
            uint256 product = amountA * amountB;
            uint256 sqrt = _sqrt(product);
            liquidity = sqrt > 1000 ? sqrt - 1000 : sqrt;
            _mint(MINIMUM_LIQUIDITY_ADDRESS, 1000);
        } else {
            liquidity = _min(
                amountA * totalSupply() / _reserveA,
                amountB * totalSupply() / _reserveB
            );
        }
        require(liquidity > 0, "Insufficient liquidity minted");
        _mint(to, liquidity);
        _update(balanceA, balanceB);
        emit Mint(to, amountA, amountB);
    }

    function burn(address to) external lock nonReentrant returns (uint256 amountA, uint256 amountB) {
        uint256 balanceA = IERC20(tokenA).balanceOf(address(this));
        uint256 balanceB = IERC20(tokenB).balanceOf(address(this));
        uint256 liquidity = balanceOf(address(this));

        _burn(address(this), liquidity);
        amountA = liquidity * balanceA / totalSupply();
        amountB = liquidity * balanceB / totalSupply();

        IERC20(tokenA).transfer(to, amountA);
        IERC20(tokenB).transfer(to, amountB);

        _update(IERC20(tokenA).balanceOf(address(this)), IERC20(tokenB).balanceOf(address(this)));
        emit Burn(msg.sender, amountA, amountB, to);
    }

    function swap(uint256 amountAOut, uint256 amountBOut, address to) external lock nonReentrant {
        require(amountAOut > 0 || amountBOut > 0, "Insufficient output amount");
        (uint256 _reserveA, uint256 _reserveB) = getReserves();
        require(amountAOut < _reserveA && amountBOut < _reserveB, "Insufficient reserves");
        require(to != tokenA && to != tokenB, "Invalid to");

        if (amountAOut > 0) {
            IERC20(tokenA).transfer(to, amountAOut);
        }
        if (amountBOut > 0) {
            IERC20(tokenB).transfer(to, amountBOut);
        }

        uint256 balanceA = IERC20(tokenA).balanceOf(address(this));
        uint256 balanceB = IERC20(tokenB).balanceOf(address(this));

        uint256 amountAIn = balanceA > _reserveA - amountAOut ? balanceA - (_reserveA - amountAOut) : 0;
        uint256 amountBIn = balanceB > _reserveB - amountBOut ? balanceB - (_reserveB - amountBOut) : 0;
        require(amountAIn > 0 || amountBIn > 0, "Insufficient input amount");

        // Enforce constant-product invariant with a 0.25% fee (factor 9975/10000).
        // balanceAdjusted = balance*10000 - amountIn*25
        {
            uint256 balanceAAdjusted = balanceA * FEE_DENOMINATOR - amountAIn * (FEE_DENOMINATOR - FEE_NUMERATOR);
            uint256 balanceBAdjusted = balanceB * FEE_DENOMINATOR - amountBIn * (FEE_DENOMINATOR - FEE_NUMERATOR);
            require(
                balanceAAdjusted * balanceBAdjusted >= _reserveA * _reserveB * (FEE_DENOMINATOR * FEE_DENOMINATOR),
                "K invariant"
            );
        }

        _update(balanceA, balanceB);
        emit Swap(msg.sender, amountAIn, amountBIn, amountAOut, amountBOut, to);
    }

    function _sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y == 0) return 0;
        z = y;
        uint256 x = y / 2 + 1;
        while (x < z) {
            z = x;
            unchecked { x = (y / x + x) / 2; }
        }
    }

    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}
