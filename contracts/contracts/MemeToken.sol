// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MemeToken is ERC20, ERC20Burnable, Ownable {
    string public imageURI;
    address public creator;
    uint256 public tradingVolume;
    uint256 public creationTime;

    mapping(address => bool) public isExcludedFromFee;
    bool public initialized;

    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 ether; // 1B

    constructor() ERC20("", "") Ownable(msg.sender) {}

    function initialize(
        string calldata _name,
        string calldata _symbol,
        string calldata _imageURI,
        address _creator,
        address _owner
    ) external {
        require(!initialized, "Already initialized");
        initialized = true;
        imageURI = _imageURI;
        creator = _creator;
        creationTime = block.timestamp;
        _transferOwnership(_owner);
        _mint(_owner, INITIAL_SUPPLY);
        // Override name/symbol after constructor
        _setName(_name);
        _setSymbol(_symbol);
        isExcludedFromFee[_owner] = true;
        isExcludedFromFee[address(this)] = true;
    }

    // Allow updating name/symbol for clones
    function _setName(string memory _name) internal {
        _nameStored = _name;
    }

    string internal _nameStored;
    string internal _symbolStored;

    function name() public view override returns (string memory) {
        return _nameStored;
    }

    function symbol() public view override returns (string memory) {
        return _symbolStored;
    }

    function _setSymbol(string memory _symbol) internal {
        _symbolStored = _symbol;
    }

    function setImageURI(string calldata _imageURI) external onlyOwner {
        imageURI = _imageURI;
    }

    function addLiquidityPool(address lp) external onlyOwner {
        isExcludedFromFee[lp] = true;
    }

    function excludeFromFee(address account) external onlyOwner {
        isExcludedFromFee[account] = true;
    }

    function trackVolume(uint256 amount) external {
        tradingVolume += amount;
    }

    function decimals() public pure override returns (uint8) {
        return 18;
    }
}
