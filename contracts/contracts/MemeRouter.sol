// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IFactory {
    function getPair(address, address) external view returns (address);
}

interface IMemePair {
    function getReserves() external view returns (uint256 reserveA, uint256 reserveB);
    function swap(uint256 amountAOut, uint256 amountBOut, address to) external;
    function tokenA() external view returns (address);
    function tokenB() external view returns (address);
}

contract MemeRouter is ReentrancyGuard {
    address public factory;

    constructor(address _factory) {
        factory = _factory;
    }

    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public pure returns (uint256) {
        require(amountIn > 0, "Insufficient amount in");
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");
        uint256 amountInWithFee = amountIn * 9975;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = reserveIn * 10000 + amountInWithFee;
        return numerator / denominator;
    }

    function getAmountsOut(uint256 amountIn, address[] memory path) public view returns (uint256[] memory amounts) {
        require(path.length >= 2, "Invalid path");
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        for (uint256 i; i < path.length - 1; i++) {
            (uint256 reserveIn, uint256 reserveOut) = _getReserves(path[i], path[i + 1]);
            amounts[i + 1] = getAmountOut(amounts[i], reserveIn, reserveOut);
        }
    }

    /// @dev Returns reserves oriented as (reserveIn, reserveOut) for tokenIn->tokenOut.
    function _getReserves(address tokenIn, address tokenOut) internal view returns (uint256, uint256) {
        address pair = IFactory(factory).getPair(tokenIn, tokenOut);
        require(pair != address(0), "Pair not found");
        (uint256 reserveA, uint256 reserveB) = IMemePair(pair).getReserves();
        address tA = IMemePair(pair).tokenA();
        return tokenIn == tA ? (reserveA, reserveB) : (reserveB, reserveA);
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to
    ) external nonReentrant returns (uint256[] memory amounts) {
        amounts = getAmountsOut(amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, "Slippage too high");

        // Send input tokens into the first pair.
        address firstPair = IFactory(factory).getPair(path[0], path[1]);
        require(firstPair != address(0), "Pair not found");
        require(IERC20(path[0]).transferFrom(msg.sender, firstPair, amountIn), "transferFrom failed");

        _swap(amounts, path, to);
    }

    function _swap(uint256[] memory amounts, address[] memory path, address to) internal {
        for (uint256 i; i < path.length - 1; i++) {
            address input = path[i];
            address output = path[i + 1];
            address pair = IFactory(factory).getPair(input, output);
            uint256 amountOut = amounts[i + 1];

            // Order the output amounts according to the pair's tokenA/tokenB.
            address tA = IMemePair(pair).tokenA();
            (uint256 amountAOut, uint256 amountBOut) = input == tA
                ? (uint256(0), amountOut)   // input is tokenA -> output is tokenB
                : (amountOut, uint256(0));  // input is tokenB -> output is tokenA

            // For multi-hop, send intermediate output to the next pair.
            address recipient = i < path.length - 2
                ? IFactory(factory).getPair(output, path[i + 2])
                : to;

            IMemePair(pair).swap(amountAOut, amountBOut, recipient);
        }
    }
}
