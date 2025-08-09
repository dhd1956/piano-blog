const { newKit } = require('@celo/contractkit');
require('dotenv').config();

const DRINK_PAYMENT_ADDRESS = '0x82749065931D343a0d9764262cED17751dBF87a8';
const DrinkPaymentArtifact = require('./DrinkPayment.json'); // You'll need to copy this

async function updateDrinkPrice() {
    const kit = newKit('https://alfajores-forno.celo-testnet.org');
    
    // Add your account
const privateKey = process.env.PRIVATE_KEY.startsWith('0x') 
    ? process.env.PRIVATE_KEY 
    : '0x' + process.env.PRIVATE_KEY;
    kit.addAccount(privateKey);
    const account = kit.web3.eth.accounts.privateKeyToAccount(privateKey);
    kit.defaultAccount = account.address;
    
    const contract = new kit.web3.eth.Contract(DrinkPaymentArtifact.abi, DRINK_PAYMENT_ADDRESS);
    
    try {
        console.log('Updating drink price to 2 tokens...');
        
        const newPrice = kit.web3.utils.toWei('2', 'ether'); // 2 tokens
        
        const tx = await contract.methods.setDrinkPrice(newPrice).send({
            from: account.address,
            gas: 100000
        });
        
        console.log('✅ Drink price updated!');
        console.log('Transaction hash:', tx.transactionHash);
        
    } catch (error) {
        console.error('❌ Error updating price:', error.message);
    }
}

updateDrinkPrice();
