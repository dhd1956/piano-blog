const { newKit } = require('@celo/contractkit');
require('dotenv').config();

async function monitorAddress(address) {
    const kit = newKit(process.env.CELO_RPC_URL || 'https://forno.celo.org');
    
    try {
        // Get CELO balance
        const celoBalance = await kit.getTotalBalance(address);
        console.log(`Address: ${address}`);
        console.log(`CELO Balance: ${kit.web3.utils.fromWei(celoBalance.CELO.toString())} CELO`);
        console.log(`cUSD Balance: ${kit.web3.utils.fromWei(celoBalance.cUSD.toString())} cUSD`);
        console.log(`cEUR Balance: ${kit.web3.utils.fromWei(celoBalance.cEUR.toString())} cEUR`);
        
    } catch (error) {
        console.error('Error monitoring address:', error.message);
    }
}

// Example usage - replace with actual address
const testAddress = '0x...your_address_here';
if (process.argv[2]) {
    monitorAddress(process.argv[2]);
} else {
    console.log('Usage: node monitor-address.js <address>');
}
