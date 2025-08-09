const { newKit } = require('@celo/contractkit');
require('dotenv').config();

async function getTransactionDetails(txHash) {
    const kit = newKit(process.env.CELO_RPC_URL || 'https://forno.celo.org');
    
    try {
        const tx = await kit.web3.eth.getTransaction(txHash);
        const receipt = await kit.web3.eth.getTransactionReceipt(txHash);
        
        console.log('Transaction Details:');
        console.log('Hash:', tx.hash);
        console.log('From:', tx.from);
        console.log('To:', tx.to);
        console.log('Value:', kit.web3.utils.fromWei(tx.value.toString()), 'CELO');
        console.log('Status:', receipt.status ? 'Success' : 'Failed');
        console.log('Gas Used:', receipt.gasUsed);
        
    } catch (error) {
        console.error('Error getting transaction:', error.message);
    }
}

// Usage: node tx-monitor.js <transaction_hash>
if (process.argv[2]) {
    getTransactionDetails(process.argv[2]);
} else {
    console.log('Usage: node tx-monitor.js <transaction_hash>');
}
