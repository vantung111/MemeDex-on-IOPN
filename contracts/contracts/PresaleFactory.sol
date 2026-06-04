// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./Presale.sol";

/// @title PresaleFactory
/// @notice Deploys per-token Presale contracts, funds them with the sale tokens,
///         and keeps an on-chain registry so the frontend can enumerate presales.
contract PresaleFactory is Ownable, ReentrancyGuard {
    struct PresaleMeta {
        address presale;
        address token;
        address creator;
        string name;
        string symbol;
        string imageURI;
        string description;
        uint256 createdAt;
    }

    PresaleMeta[] public presales;
    mapping(address => uint256[]) public creatorPresales;
    mapping(address => bool) public isPresale;

    event PresaleCreated(
        uint256 indexed presaleId,
        address indexed creator,
        address indexed presale,
        address token
    );

    constructor(address initialOwner) Ownable(initialOwner) {}

    struct CreateParams {
        address token;
        uint256 rate;            // tokens per OPN
        uint256 hardCap;
        uint256 softCap;
        uint256 minPurchase;
        uint256 maxPurchase;
        uint256 startTime;
        uint256 endTime;
        uint256 listingRate;
        uint256 tokensForSale;
        string name;
        string symbol;
        string imageURI;
        string description;
    }

    /// @notice Create a presale. The caller must have approved this factory to
    ///         transfer `tokensForSale` of `token` beforehand.
    function createPresale(CreateParams calldata p) external nonReentrant returns (address presaleAddr) {
        require(p.token != address(0), "Invalid token");
        require(p.tokensForSale > 0, "No tokens for sale");
        require(p.hardCap >= p.softCap && p.softCap > 0, "Invalid caps");
        require(p.endTime > p.startTime, "Invalid window");
        require(p.rate > 0, "Invalid rate");

        // Deploy the presale owned by the creator.
        Presale presale = new Presale(
            p.token,
            msg.sender,
            p.rate,
            p.hardCap,
            p.softCap,
            p.minPurchase,
            p.maxPurchase,
            p.startTime,
            p.endTime,
            p.listingRate,
            p.tokensForSale,
            msg.sender
        );
        presaleAddr = address(presale);

        // Fund the presale with sale tokens pulled from the creator.
        require(
            IERC20(p.token).transferFrom(msg.sender, presaleAddr, p.tokensForSale),
            "Token funding failed"
        );
        require(presale.isFunded(), "Underfunded");

        uint256 presaleId = presales.length;
        presales.push(PresaleMeta({
            presale: presaleAddr,
            token: p.token,
            creator: msg.sender,
            name: p.name,
            symbol: p.symbol,
            imageURI: p.imageURI,
            description: p.description,
            createdAt: block.timestamp
        }));
        creatorPresales[msg.sender].push(presaleId);
        isPresale[presaleAddr] = true;

        emit PresaleCreated(presaleId, msg.sender, presaleAddr, p.token);
    }

    function presaleCount() external view returns (uint256) {
        return presales.length;
    }

    /// @notice Return a page of presale metadata for listing in the UI.
    function getPresales(uint256 start, uint256 count)
        external
        view
        returns (PresaleMeta[] memory page)
    {
        uint256 len = presales.length;
        if (start >= len) return new PresaleMeta[](0);
        uint256 end = start + count;
        if (end > len) end = len;
        page = new PresaleMeta[](end - start);
        for (uint256 i = start; i < end; i++) {
            page[i - start] = presales[i];
        }
    }

    function getCreatorPresales(address creator) external view returns (uint256[] memory) {
        return creatorPresales[creator];
    }
}
