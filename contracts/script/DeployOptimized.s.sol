// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/VenueRegistry.sol";
import "../src/DrinkPayment.sol";

contract DeployOptimized is Script {
    
    // Celo testnet token addresses
    address constant ALFAJORES_CUSD = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;
    address constant ALFAJORES_CEUR = 0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F;
    address constant ALFAJORES_CELO = 0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9;
    
    // Celo mainnet token addresses
    address constant MAINNET_CUSD = 0x765DE816845861e75A25fCA122bb6898B8B1282a;
    address constant MAINNET_CEUR = 0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73;
    address constant MAINNET_CELO = 0x471EcE3750Da237f93B8E339c536989b8978a438;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=== Piano Style Platform - Optimized Deployment ===");
        console.log("Deploying contracts with account:", deployer);
        console.log("Account balance:", deployer.balance);
        
        // Determine which token to use based on chain ID
        address tokenAddress;
        string memory networkName;
        
        if (block.chainid == 44787) {
            // Alfajores testnet
            tokenAddress = ALFAJORES_CUSD;
            networkName = "Alfajores Testnet";
            console.log("Network: Alfajores Testnet");
            console.log("Using cUSD as reward/payment token:", tokenAddress);
        } else if (block.chainid == 42220) {
            // Celo mainnet
            tokenAddress = MAINNET_CUSD;
            networkName = "Celo Mainnet";
            console.log("Network: Celo Mainnet");
            console.log("Using cUSD as reward/payment token:", tokenAddress);
        } else {
            revert("Unsupported chain ID");
        }
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy VenueRegistry (gas-optimized with IPFS)
        console.log("\n1. Deploying VenueRegistry...");
        VenueRegistry venueRegistry = new VenueRegistry(tokenAddress);
        console.log("VenueRegistry deployed at:", address(venueRegistry));
        
        // Deploy DrinkPayment
        console.log("\n2. Deploying DrinkPayment...");
        DrinkPayment drinkPayment = new DrinkPayment(tokenAddress, deployer);
        console.log("DrinkPayment deployed at:", address(drinkPayment));
        
        // Initial configuration
        console.log("\n3. Configuring contracts...");
        
        // VenueRegistry configuration
        venueRegistry.setBaseReward(1 ether); // 1 token base reward
        console.log("VenueRegistry: Base reward set to 1 token");
        
        // DrinkPayment configuration  
        drinkPayment.setDrinkPrice(5 ether); // 5 tokens per drink
        console.log("DrinkPayment: Drink price set to 5 tokens");
        
        drinkPayment.setPlatformFee(2); // 2% platform fee
        console.log("DrinkPayment: Platform fee set to 2%");
        
        // Add a test venue for demo purposes
        console.log("\n4. Adding test venue...");
        drinkPayment.addVenue(
            0x1673A1b7DDCF7a7850Df2577067d93897a1CE8E0, // Your test address
            "Test Jazz Cafe",
            2 // 2% venue-specific fee
        );
        console.log("Test venue added for demonstration");
        
        vm.stopBroadcast();
        
        // Deployment summary
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("Network:", networkName);
        console.log("Chain ID:", block.chainid);
        console.log("Deployer:", deployer);
        console.log("Token Address (cUSD):", tokenAddress);
        console.log("");
        console.log("Contract Addresses:");
        console.log("VenueRegistry:", address(venueRegistry));
        console.log("DrinkPayment:", address(drinkPayment));
        console.log("");
        console.log("Configuration:");
        console.log("- Base reward: 1 token per verified venue");
        console.log("- Drink price: 5 tokens");
        console.log("- Platform fee: 2%");
        console.log("");
        console.log("Next steps:");
        console.log("1. Fund contracts with cUSD for rewards");
        console.log("2. Test venue submission workflow");
        console.log("3. Update frontend with new contract addresses");
        console.log("4. Add real venues to the system");
    }
}


