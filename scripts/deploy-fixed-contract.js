const Web3 = require('web3')
const fs = require('fs')

// Contract ABI for VenueRegistry_Fixed.sol
const contractABI = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [{ name: 'venueId', type: 'uint256' }],
    name: 'getVenueById',
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'name', type: 'string' },
          { name: 'city', type: 'string' },
          { name: 'contactInfo', type: 'string' },
          { name: 'hasPiano', type: 'bool' },
          { name: 'verified', type: 'bool' },
          { name: 'submittedBy', type: 'address' },
          { name: 'timestamp', type: 'uint32' },
        ],
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'venueCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'city', type: 'string' },
      { name: 'contactInfo', type: 'string' },
      { name: 'hasPiano', type: 'bool' },
    ],
    name: 'submitVenue',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'venueId', type: 'uint256' },
      { name: 'newName', type: 'string' },
      { name: 'newContactInfo', type: 'string' },
    ],
    name: 'updateVenue',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'venueId', type: 'uint256' },
      { name: 'approved', type: 'bool' },
    ],
    name: 'verifyVenue',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]

// Contract bytecode - you'll need to compile VenueRegistry_Fixed.sol to get this
const contractBytecode = 'BYTECODE_PLACEHOLDER'

async function deployContract() {
  console.log('🚀 DEPLOYING VENUEREGISTRY_FIXED CONTRACT')
  console.log('==========================================\n')

  // Check for private key
  const privateKey = process.env.PRIVATE_KEY
  if (!privateKey) {
    console.error('❌ Error: PRIVATE_KEY environment variable not set')
    console.log('\n💡 Usage:')
    console.log('   PRIVATE_KEY=your_private_key_here node scripts/deploy-fixed-contract.js')
    console.log('\n🔐 To get your private key:')
    console.log('   1. Open MetaMask')
    console.log('   2. Click account menu → Account Details → Export Private Key')
    console.log('   3. Copy the private key (without 0x prefix)')
    process.exit(1)
  }

  try {
    // Setup Web3 connection to Celo Alfajores
    const web3 = new Web3(
      new Web3.providers.HttpProvider('https://alfajores-forno.celo-testnet.org')
    )

    // Create account from private key
    const account = web3.eth.accounts.privateKeyToAccount(
      privateKey.startsWith('0x') ? privateKey : '0x' + privateKey
    )
    web3.eth.accounts.wallet.add(account)

    console.log(`📋 Deploying from account: ${account.address}`)

    // Check account balance
    const balance = await web3.eth.getBalance(account.address)
    const balanceInCelo = web3.utils.fromWei(balance, 'ether')
    console.log(`💰 Account balance: ${balanceInCelo} CELO`)

    if (parseFloat(balanceInCelo) < 0.01) {
      console.log('⚠️  Warning: Low balance. Get testnet CELO from: https://faucet.celo.org/')
    }

    // Check if we have bytecode
    if (contractBytecode === 'BYTECODE_PLACEHOLDER') {
      console.log('❌ Contract bytecode not provided.')
      console.log('\n🔧 To get bytecode:')
      console.log('1. Go to https://remix.ethereum.org/')
      console.log('2. Create new file and paste VenueRegistry_Fixed.sol content')
      console.log('3. Compile the contract (Solidity 0.8.19)')
      console.log('4. Copy bytecode from compilation artifacts')
      console.log('5. Replace BYTECODE_PLACEHOLDER in this script')

      // Save ABI for manual compilation
      fs.writeFileSync('./VenueRegistry_Fixed_ABI.json', JSON.stringify(contractABI, null, 2))
      console.log('💾 ABI saved to ./VenueRegistry_Fixed_ABI.json')

      process.exit(1)
    }

    // Deploy contract
    console.log('\n🔨 Deploying contract...')

    const contract = new web3.eth.Contract(contractABI)
    const deployTx = contract.deploy({
      data: contractBytecode,
    })

    // Estimate gas
    const gasEstimate = await deployTx.estimateGas({ from: account.address })
    console.log(`⛽ Estimated gas: ${gasEstimate}`)

    // Send deployment transaction
    const deployedContract = await deployTx.send({
      from: account.address,
      gas: Math.floor(gasEstimate * 1.2), // Add 20% buffer
      gasPrice: await web3.eth.getGasPrice(),
    })

    console.log('✅ Contract deployed successfully!')
    console.log(`📍 Contract address: ${deployedContract.options.address}`)
    console.log(
      `🔗 View on Celoscan: https://alfajores.celoscan.io/address/${deployedContract.options.address}`
    )

    // Test basic functionality
    console.log('\n🧪 Testing deployed contract...')

    const venueCount = await deployedContract.methods.venueCount().call()
    const owner = await deployedContract.methods.owner().call()

    console.log(`   Initial venue count: ${venueCount}`)
    console.log(`   Contract owner: ${owner}`)

    // Update deployment info
    const deploymentInfo = {
      contractAddress: deployedContract.options.address,
      deployedAt: new Date().toISOString(),
      network: 'Celo Alfajores Testnet',
      deployer: account.address,
      abi: contractABI,
    }

    fs.writeFileSync('./DEPLOYMENT_INFO.json', JSON.stringify(deploymentInfo, null, 2))
    console.log('💾 Deployment info saved to ./DEPLOYMENT_INFO.json')

    console.log('\n🎉 Deployment complete!')
    console.log('\n📝 Next steps:')
    console.log('1. Update your frontend to use the new contract address')
    console.log('2. Test venue submission functionality')
    console.log('3. Update CLAUDE.md with the new contract address')
  } catch (error) {
    console.error('❌ Deployment failed:', error.message)

    if (error.message.includes('insufficient funds')) {
      console.log('💡 Get testnet CELO from: https://faucet.celo.org/')
    }

    process.exit(1)
  }
}

deployContract().catch(console.error)
