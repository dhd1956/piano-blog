// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PXP Token
 * @dev Piano eXPerience Token - Simple ERC20 token for the Piano Style community
 * No demurrage, no decay, just a standard community token
 */
contract PXPToken is ERC20, Ownable {
    // Total supply: 1 million PXP tokens
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10**18;

    constructor() ERC20("Piano eXPerience Token", "PXP") Ownable(msg.sender) {
        // Mint initial supply to deployer
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    /**
     * @dev Mint additional tokens (only owner)
     * Allows for controlled supply expansion if needed
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Burn tokens from caller's balance
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
