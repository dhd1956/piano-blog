const { newKit } = require('@celo/contractkit');
require('dotenv').config();

async function getValidatorInfo() {
    const kit = newKit(process.env.CELO_RPC_URL || 'https://forno.celo.org');
    
    try {
        const validators = await kit.contracts.getValidators();
        const election = await kit.contracts.getElection();
        
        console.log('=== Validator Information ===');
        
        // Get total votes
        const totalVotes = await election.getTotalVotes();
        console.log('Total Votes in Election:', kit.web3.utils.fromWei(totalVotes.toString()));
        
        // This is a simplified example - actual implementation would require more detailed queries
        console.log('\nUse Celo MCP functions for detailed validator data:');
        console.log('- celo-mcp:get_validator_groups');
        console.log('- celo-mcp:get_total_staking_info');
        console.log('- celo-mcp:get_staking_balances');
        
    } catch (error) {
        console.error('Error getting validator info:', error.message);
    }
}

getValidatorInfo();
