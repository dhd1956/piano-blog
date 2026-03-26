// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/PXPRewards.sol";

/**
 * @title Deploy PXPRewards V3
 * @notice Adds tipWithBurn() — 10% of every tip is permanently burned
 * @dev Run with:
 *   forge script script/DeployPXPRewardsV3.s.sol:DeployPXPRewardsV3 \
 *     --rpc-url $CELO_SEPOLIA_RPC --broadcast --verify
 */
contract DeployPXPRewardsV3 is Script {
    // Deployed PXP token on Celo Sepolia (unchanged)
    address constant PXP_TOKEN_ADDRESS = 0x04eAE71832147D75D4B69B3FFB5d9514e8471c75;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deployer:      ", deployer);
        console.log("PXP Token:     ", PXP_TOKEN_ADDRESS);

        vm.startBroadcast(deployerPrivateKey);

        PXPRewards rewards = new PXPRewards(PXP_TOKEN_ADDRESS);

        console.log("PXPRewards V3: ", address(rewards));
        console.log("Burn rate:     ", rewards.burnRateBps(), "bps (10%)");

        vm.stopBroadcast();

        console.log("\nNext steps:");
        console.log("1. Update NEXT_PUBLIC_PXP_REWARDS_ADDRESS in .env.local");
        console.log("2. Fund contract: call fundRewards(amount) after approving token transfer");
        console.log("3. Add curators: setVerifierStatus(address, true)");
    }
}
