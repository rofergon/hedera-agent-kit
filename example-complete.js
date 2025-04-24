// Import dependencies
require('dotenv').config();
const { HederaAgentKit, createHederaTools } = require('hedera-agent-kit');
const { PrivateKey, TokenId, TopicId } = require('@hashgraph/sdk');

// Get the public key from the private key
const privateKeyObject = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY);
const publicKeyDer = privateKeyObject.publicKey.toStringDer();

// Create Hedera agent instance
const hederaAgent = new HederaAgentKit(
  process.env.HEDERA_ACCOUNT_ID,
  process.env.HEDERA_PRIVATE_KEY,
  publicKeyDer,
  process.env.HEDERA_NETWORK
);

// Main function to demonstrate various operations
async function runExamples() {
  try {
    console.log("=== Account Information ===");
    // Get HBAR balance
    const balance = await hederaAgent.getHbarBalance();
    console.log('HBAR Balance:', balance);

    // Get all tokens
    console.log("\n=== Account Tokens ===");
    const tokensBalance = await hederaAgent.getAllTokensBalances(process.env.HEDERA_NETWORK);
    console.log('Token Balances:', tokensBalance);

    // Create a new fungible token
    console.log("\n=== Creating Fungible Token ===");
    console.log("Creating fungible token...");
    const createTokenResult = await hederaAgent.createFT({
      name: "Example Token",
      symbol: "EXMP",
      decimals: 2,
      initialSupply: 1000,
      maxSupply: 10000,
      memo: "Token created with Hedera Agent Kit"
    });
    console.log("Token created:", createTokenResult);
    
    // If token was created successfully, perform more operations
    if (createTokenResult.status) {
      const tokenId = createTokenResult.tokenId;
      console.log(`Token ID: ${tokenId}`);
      
      // Wait a moment for the token to propagate
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Get token details
      console.log("\n=== Token Details ===");
      const tokenDetails = await hederaAgent.getHtsTokenDetails(tokenId.toString(), process.env.HEDERA_NETWORK);
      console.log("Token details:", tokenDetails);
      
      // Create an HCS topic
      console.log("\n=== Creating HCS Topic ===");
      const topicResult = await hederaAgent.createTopic("My example topic", true);
      console.log("Topic created:", topicResult);
      
      if (topicResult.status) {
        const topicId = topicResult.topicId;
        console.log(`Topic ID: ${topicId}`);
        
        // Send message to the topic
        console.log("\n=== Sending Message to Topic ===");
        const messageResult = await hederaAgent.submitTopicMessage(
          TopicId.fromString(topicId), 
          "Hello, this is a test message!"
        );
        console.log("Message sent:", messageResult);
        
        // Wait a moment for the message to be processed
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Get messages from the topic
        console.log("\n=== Topic Messages ===");
        const messages = await hederaAgent.getTopicMessages(
          TopicId.fromString(topicId), 
          process.env.HEDERA_NETWORK
        );
        console.log("Messages:", messages);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
runExamples(); 