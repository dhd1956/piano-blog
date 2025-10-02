// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/PXPToken.sol";
import "../src/PXPRewards.sol";

contract DeployPXP is Script {
    function run() external {
        // Read private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy PXP Token
        PXPToken token = new PXPToken();
        console.log("PXP Token deployed at:", address(token));

        // 2. Deploy PXP Rewards Contract
        PXPRewards rewards = new PXPRewards(address(token));
        console.log("PXP Rewards deployed at:", address(rewards));

        // 3. Fund rewards contract with initial tokens (e.g., 100,000 PXP)
        uint256 fundAmount = 100_000 * 10**18;
        token.transfer(address(rewards), fundAmount);
        console.log("Funded rewards contract with:", fundAmount / 10**18, "PXP");

        // 4. Optional: Add initial verifiers
        // Uncomment and set your curator address
        // address[] memory initialVerifiers = new address[](1);
        // initialVerifiers[0] = 0xYourCuratorAddress;
        // rewards.addVerifiersBatch(initialVerifiers);

        vm.stopBroadcast();

        console.log("\n=== Deployment Summary ===");
        console.log("PXP Token:", address(token));
        console.log("PXP Rewards:", address(rewards));
        console.log("Initial Supply:", token.totalSupply() / 10**18, "PXP");
        console.log("Rewards Balance:", token.balanceOf(address(rewards)) / 10**18, "PXP");
    }
}
