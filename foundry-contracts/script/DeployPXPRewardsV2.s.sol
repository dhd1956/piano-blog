// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/PXPRewards.sol";
import "../src/PXPToken.sol";

/**
 * @title Deploy PXPRewards V2
 * @notice Deployment script for the upgraded PXPRewards contract with configurable rewards
 * @dev Run with: forge script script/DeployPXPRewardsV2.s.sol:DeployPXPRewardsV2 --rpc-url $CELO_ALFAJORES_RPC --broadcast --verify
 */
contract DeployPXPRewardsV2 is Script {
    // Existing PXP Token address on Celo Alfajores
    address constant PXP_TOKEN_ADDRESS = 0x7B1E3d40Acf8ea8717822E23096eFf8fE8573d35;

    function run() external {
        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying PXPRewards V2 with account:", deployer);
        console.log("Using PXP Token at:", PXP_TOKEN_ADDRESS);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy new rewards contract
        PXPRewards rewards = new PXPRewards(PXP_TOKEN_ADDRESS);

        console.log("PXPRewards V2 deployed at:", address(rewards));
        console.log("Owner:", rewards.owner());

        // Verify initial reward amounts
        (uint256 newUserReward, uint256 scoutReward, uint256 verifierReward) = rewards.getAllRewards();
        console.log("Initial New User Reward:", newUserReward / 1e18, "PXP");
        console.log("Initial Scout Reward:", scoutReward / 1e18, "PXP");
        console.log("Initial Verifier Reward:", verifierReward / 1e18, "PXP");

        // Get reward limits
        (uint256 minReward, uint256 maxReward) = rewards.getRewardLimits();
        console.log("Min Reward:", minReward / 1e18, "PXP");
        console.log("Max Reward:", maxReward / 1e18, "PXP");

        vm.stopBroadcast();

        console.log("\nNext steps:");
        console.log("1. Fund the rewards contract with PXP tokens");
        console.log("2. Add authorized verifiers using setVerifierStatus()");
        console.log("3. Update frontend to use new contract address");
        console.log("4. Test reward configuration with setNewUserReward(), setScoutReward(), setVerifierReward()");
    }
}
