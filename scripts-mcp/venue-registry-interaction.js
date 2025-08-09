const { newKit } = require('@celo/contractkit');
require('dotenv').config();

// Your VenueRegistry contract ABI (simplified)
const VENUE_REGISTRY_ABI = [
    {
        "inputs": [],
        "name": "venueCount",
        "outputs": [{"type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"type": "uint256", "name": "venueId"}],
        "name": "getVenueById",
        "outputs": [{"type": "tuple", "components": [
            {"type": "string", "name": "name"},
            {"type": "string", "name": "city"},
            {"type": "bool", "name": "hasPiano"},
            {"type": "bool", "name": "verified"}
        ]}],
        "stateMutability": "view",
        "type": "function"
    }
];

async function interactWithVenueRegistry(contractAddress) {
    const kit = newKit(process.env.CELO_RPC_URL || 'https://forno.celo.org');
    
    try {
        const contract = new kit.web3.eth.Contract(VENUE_REGISTRY_ABI, contractAddress);
        
        // Get total venue count
        const venueCount = await contract.methods.venueCount().call();
        console.log('Total venues registered:', venueCount);
        
        // Get details of first few venues
        for (let i = 0; i < Math.min(3, venueCount); i++) {
            const venue = await contract.methods.getVenueById(i).call();
            console.log(`\nVenue ${i}:`);
            console.log('Name:', venue.name);
            console.log('City:', venue.city);
            console.log('Has Piano:', venue.hasPiano);
            console.log('Verified:', venue.verified);
        }
        
    } catch (error) {
        console.error('Error interacting with contract:', error.message);
    }
}

// Usage: node venue-registry-interaction.js <contract_address>
if (process.argv[2]) {
    interactWithVenueRegistry(process.argv[2]);
} else {
    console.log('Usage: node venue-registry-interaction.js <contract_address>');
    console.log('Deploy your VenueRegistry contract first and use its address');
}
