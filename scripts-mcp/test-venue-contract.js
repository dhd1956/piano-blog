const { newKit } = require('@celo/contractkit');
require('dotenv').config();

const CONTRACT_ADDRESS = '0x0Bd9580D25aEa3afa51F1daF92e25198ae9c5642';

// Minimal ABI for testing (you'll need the full ABI for complete functionality)

const VenueRegistryArtifact = require('./VenueRegistry.json');
const VENUE_REGISTRY_ABI = VenueRegistryArtifact.abi;
//const VENUE_REGISTRY_ABI = [
//    {
//        "inputs": [],
//        "name": "venueCount",
//        "outputs": [{"type": "uint256"}],
//        "stateMutability": "view",
//        "type": "function"
//    },
//    {
//        "inputs": [],
//        "name": "owner",
//        "outputs": [{"type": "address"}],
//        "stateMutability": "view",
//        "type": "function"
//    },
//    {
//        "inputs": [],
//        "name": "rewardToken",
//        "outputs": [{"type": "address"}],
//        "stateMutability": "view",
//        "type": "function"
//    }
//];

async function testContract() {
    const kit = newKit('https://alfajores-forno.celo-testnet.org');
    
    try {
        console.log('🧪 Testing VenueRegistry Contract');
        console.log('Contract Address:', CONTRACT_ADDRESS);
        
        // Step 1: Check if contract exists
        const code = await kit.web3.eth.getCode(CONTRACT_ADDRESS);
        if (code === '0x') {
            console.error('❌ No contract found at address');
            return;
        }
        console.log('✅ Contract exists on-chain');
        
        // Step 2: Create contract instance
        const contract = new kit.web3.eth.Contract(VENUE_REGISTRY_ABI, CONTRACT_ADDRESS);
        
        // Step 3: Query venue count
        const venueCount = await contract.methods.venueCount().call();
        console.log('📊 Current venue count:', venueCount);
        
        // Step 4: Query owner
        const owner = await contract.methods.owner().call();
        console.log('👤 Contract owner:', owner);
        
        // Step 5: Query reward token
        const rewardToken = await contract.methods.rewardToken().call();
        console.log('🪙 Reward token address:', rewardToken);
        
        console.log('\n✅ Contract state query successful!');
        
    } catch (error) {
        console.error('❌ Error testing contract:', error.message);
    }
}

testContract();

