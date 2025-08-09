const { newKit } = require('@celo/contractkit');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Contract compilation artifacts (you'll need to compile these first)
const VenueRegistryArtifact = require('./contracts/VenueRegistry.json');
const DrinkPaymentArtifact = require('./contracts/DrinkPayment.json');
const CommunityRegistryArtifact = require('./contracts/CommunityRegistry.json');

class ContractDeployer {
    constructor() {
        // Initialize Celo kit
        const rpcUrl = process.env.NODE_ENV === 'production' 
            ? process.env.CELO_RPC_URL 
            : process.env.CELO_TESTNET_RPC_URL || 'https://alfajores-forno.celo-testnet.org';
            
        this.kit = newKit(rpcUrl);
        
        // Add account from private key
        if (process.env.PRIVATE_KEY) {
            this.kit.addAccount(process.env.PRIVATE_KEY);
            this.deployer = this.kit.web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
            this.kit.defaultAccount = this.deployer.address;
        } else {
            throw new Error('PRIVATE_KEY environment variable is required');
        }
        
        console.log(`🚀 Deploying from account: ${this.deployer.address}`);
        console.log(`🌐 Network: ${rpcUrl}`);
    }

    async checkBalance() {
        const balance = await this.kit.getTotalBalance(this.deployer.address);
        const celoBalance = this.kit.web3.utils.fromWei(balance.CELO.toString());
        
        console.log(`💰 CELO Balance: ${celoBalance} CELO`);
        
        if (parseFloat(celoBalance) < 0.1) {
            console.warn('⚠️  Low CELO balance. You might need more CELO for gas fees.');
            console.log('For testnet, get CELO from: https://faucet.celo.org');
        }
        
        return balance;
    }

    async estimateGas(contract, constructorArgs = []) {
        try {
            const tempContract = new this.kit.web3.eth.Contract(contract.abi);
            const deployData = tempContract.deploy({
                data: contract.bytecode,
                arguments: constructorArgs
            }).encodeABI();

            const gasEstimate = await this.kit.web3.eth.estimateGas({
                from: this.deployer.address,
                data: deployData
            });

            return gasEstimate;
        } catch (error) {
            console.warn('⚠️  Could not estimate gas, using default');
            return 2000000; // Default gas limit
        }
    }

    async deployContract(name, artifact, constructorArgs = []) {
        console.log(`\n📋 Deploying ${name}...`);
        
        try {
            // Estimate gas
            const gasEstimate = await this.estimateGas(artifact, constructorArgs);
            console.log(`⛽ Estimated Gas: ${gasEstimate}`);
            
            // Get current gas price
            const gasPrice = await this.kit.web3.eth.getGasPrice();
            console.log(`💨 Gas Price: ${this.kit.web3.utils.fromWei(gasPrice, 'gwei')} gwei`);
            
            // Deploy contract
            const contract = new this.kit.web3.eth.Contract(artifact.abi);
            const deployTx = contract.deploy({
                data: artifact.bytecode,
                arguments: constructorArgs
            });

            const tx = await deployTx.send({
                from: this.deployer.address,
                gas: Math.floor(gasEstimate * 1.2), // Add 20% buffer
                gasPrice: gasPrice
            });

            console.log(`✅ ${name} deployed successfully!`);
            console.log(`📍 Address: ${tx.options.address}`);
            console.log(`🔗 Transaction: ${tx.transactionHash}`);
            
            return {
                name,
                address: tx.options.address,
                transactionHash: tx.transactionHash,
                contract: tx
            };
            
        } catch (error) {
            console.error(`❌ Failed to deploy ${name}:`, error.message);
            throw error;
        }
    }

    async deployVenueRegistry(rewardTokenAddress) {
        console.log(`\n🏢 Deploying VenueRegistry with reward token: ${rewardTokenAddress}`);
        
        const constructorArgs = [rewardTokenAddress];
        
        return await this.deployContract(
            'VenueRegistry',
            VenueRegistryArtifact,
            constructorArgs
        );
    }

    async deployDrinkPayment(paymentTokenAddress) {
        console.log(`\n🍺 Deploying DrinkPayment with payment token: ${paymentTokenAddress}`);
        
        const constructorArgs = [paymentTokenAddress];
        
        return await this.deployContract(
            'DrinkPayment',
            DrinkPaymentArtifact,
            constructorArgs
        );
    }

    async deployCommunityRegistry() {
        console.log(`\n👥 Deploying CommunityRegistry...`);
        
        return await this.deployContract(
            'CommunityRegistry',
            CommunityRegistryArtifact,
            [] // No constructor arguments
        );
    }

    async deployMockTCoin() {
        console.log(`\n🪙 Deploying Mock TCoin for testing...`);
        
        // Simple ERC20 mock contract
        const mockTokenABI = [
            {
                "inputs": [
                    {"internalType": "string", "name": "name", "type": "string"},
                    {"internalType": "string", "name": "symbol", "type": "string"},
                    {"internalType": "uint256", "name": "initialSupply", "type": "uint256"}
                ],
                "stateMutability": "nonpayable",
                "type": "constructor"
            }
        ];
        
        // You would need the bytecode for a real ERC20 token
        // For now, we'll use a placeholder or existing token
        
        // On Alfajores testnet, you can use existing tokens:
        const testTokenAddresses = {
            cUSD: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1',
            cEUR: '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F',
            CELO: '0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9'
        };
        
        console.log(`📋 Using existing testnet cUSD as TCoin: ${testTokenAddresses.cUSD}`);
        
        return {
            name: 'MockTCoin',
            address: testTokenAddresses.cUSD,
            transactionHash: null,
            contract: null
        };
    }

    async verifyDeployments(deployments) {
        console.log(`\n🔍 Verifying deployments...`);
        
        for (const deployment of deployments) {
            if (deployment.transactionHash) {
                try {
                    const receipt = await this.kit.web3.eth.getTransactionReceipt(deployment.transactionHash);
                    const gasUsed = receipt.gasUsed;
                    const effectiveGasPrice = receipt.effectiveGasPrice || await this.kit.web3.eth.getGasPrice();
                    const txCost = this.kit.web3.utils.fromWei((gasUsed * effectiveGasPrice).toString());
                    
                    console.log(`✅ ${deployment.name}:`);
                    console.log(`   Address: ${deployment.address}`);
                    console.log(`   Gas Used: ${gasUsed}`);
                    console.log(`   Cost: ${txCost} CELO`);
                    
                    // Test contract is responsive
                    const code = await this.kit.web3.eth.getCode(deployment.address);
                    if (code === '0x') {
                        console.error(`❌ No contract code found at ${deployment.address}`);
                    }
                    
                } catch (error) {
                    console.error(`❌ Failed to verify ${deployment.name}:`, error.message);
                }
            }
        }
    }

    async saveDeploymentInfo(deployments) {
        const deploymentInfo = {
            network: process.env.NODE_ENV === 'production' ? 'mainnet' : 'alfajores',
            timestamp: new Date().toISOString(),
            deployer: this.deployer.address,
            contracts: {}
        };
        
        deployments.forEach(deployment => {
            deploymentInfo.contracts[deployment.name] = {
                address: deployment.address,
                transactionHash: deployment.transactionHash
            };
        });
        
        // Save to file
        const filename = `deployments-${deploymentInfo.network}-${Date.now()}.json`;
        const filepath = path.join(__dirname, 'deployments', filename);
        
        // Ensure deployments directory exists
        const deployDir = path.dirname(filepath);
        if (!fs.existsSync(deployDir)) {
            fs.mkdirSync(deployDir, { recursive: true });
        }
        
        fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
        
        // Also save as latest
        const latestPath = path.join(deployDir, `latest-${deploymentInfo.network}.json`);
        fs.writeFileSync(latestPath, JSON.stringify(deploymentInfo, null, 2));
        
        console.log(`💾 Deployment info saved to: ${filepath}`);
        
        return deploymentInfo;
    }

    async setupInitialConfiguration(deployments) {
        console.log(`\n⚙️  Setting up initial configuration...`);
        
        const venueRegistry = deployments.find(d => d.name === 'VenueRegistry');
        const tcoin = deployments.find(d => d.name === 'MockTCoin');
        
        if (venueRegistry && venueRegistry.contract) {
            try {
                // Set base reward (10 TCoin = 10 * 10^18 wei)
                const baseReward = this.kit.web3.utils.toWei('10', 'ether');
                
                console.log(`Setting base reward to 10 TCoin...`);
                await venueRegistry.contract.methods.setBaseReward(baseReward).send({
                    from: this.deployer.address,
                    gas: 100000
                });
                
                console.log(`✅ Base reward configured`);
                
            } catch (error) {
                console.error(`❌ Failed to configure VenueRegistry:`, error.message);
            }
        }
    }
}

async function main() {
    console.log(`
🎹 Piano Style - Smart Contract Deployment
==========================================
`);

    try {
        const deployer = new ContractDeployer();
        
        // Check balance
        await deployer.checkBalance();
        
        const deployments = [];
        
        // 1. Deploy Mock TCoin (or use existing testnet token)
        const tcoin = await deployer.deployMockTCoin();
        deployments.push(tcoin);
        
        // 2. Deploy VenueRegistry
        const venueRegistry = await deployer.deployVenueRegistry(tcoin.address);
        deployments.push(venueRegistry);
        
        // 3. Deploy DrinkPayment
        const drinkPayment = await deployer.deployDrinkPayment(tcoin.address);
        deployments.push(drinkPayment);
        
        // 4. Deploy CommunityRegistry
        const communityRegistry = await deployer.deployCommunityRegistry();
        deployments.push(communityRegistry);
        
        // Verify all deployments
        await deployer.verifyDeployments(deployments);
        
        // Setup initial configuration
        await deployer.setupInitialConfiguration(deployments);
        
        // Save deployment information
        const deploymentInfo = await deployer.saveDeploymentInfo(deployments);
        
        console.log(`
🎉 Deployment Complete!
=======================
Network: ${deploymentInfo.network}
Deployer: ${deploymentInfo.deployer}

Contract Addresses:
${Object.entries(deploymentInfo.contracts).map(([name, info]) => 
    `  ${name}: ${info.address}`
).join('\n')}

Next Steps:
1. Update your .env file with contract addresses
2. Verify contracts on Celo Explorer
3. Test contract interactions
4. Deploy frontend with new contract addresses

Deployment info saved to: deployments/latest-${deploymentInfo.network}.json
`);
        
    } catch (error) {
        console.error(`\n❌ Deployment failed:`, error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Handle script execution
if (require.main === module) {
    main().then(() => {
        console.log('🎯 Deployment script completed successfully');
        process.exit(0);
    }).catch(error => {
        console.error('💥 Deployment script failed:', error);
        process.exit(1);
    });
}

module.exports = { ContractDeployer };

