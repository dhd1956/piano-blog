const { ContractKit, newKit } = require('@celo/contractkit');
require('dotenv').config();

async function testCeloConnection() {
    // Connect to Celo network
    const kit = newKit(process.env.CELO_RPC_URL || 'https://forno.celo.org');
    
    try {
        // Test network connection
        const networkConfig = await kit.web3.eth.getChainId();
        console.log('Connected to Celo network, Chain ID:', networkConfig);
        
        // Get latest block
        const latestBlock = await kit.web3.eth.getBlockNumber();
        console.log('Latest block number:', latestBlock);
        
        // Get network status
        const accounts = await kit.web3.eth.getAccounts();
        console.log('Network accounts available:', accounts.length);
        
    } catch (error) {
        console.error('Connection error:', error.message);
    }
}

testCeloConnection();
