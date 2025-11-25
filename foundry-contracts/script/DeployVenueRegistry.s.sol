// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/VenueRegistry.sol";

contract DeployVenueRegistry is Script {
    function run() external {
        // Read private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy VenueRegistry
        VenueRegistry venueRegistry = new VenueRegistry();
        console.log("VenueRegistry deployed at:", address(venueRegistry));

        // Verify deployment
        console.log("Contract owner:", venueRegistry.owner());
        console.log("Initial venue count:", venueRegistry.venueCount());

        vm.stopBroadcast();

        console.log("\n=== Deployment Summary ===");
        console.log("Network: Celo Sepolia Testnet");
        console.log("VenueRegistry Address:", address(venueRegistry));
        console.log("Owner:", venueRegistry.owner());
        console.log("\nNext Steps:");
        console.log("1. Update NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local");
        console.log("2. Verify contract on Celoscan:");
        console.log("   forge verify-contract", address(venueRegistry), "VenueRegistry");
        console.log("   --chain-id 11142220 --watch");
    }
}
