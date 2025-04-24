#!/usr/bin/env node

/**
 * Helper script to set up the Hedera LangGraph Agent
 */

const fs = require('fs');
const readline = require('readline');
const { execSync } = require('child_process');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("=================================================");
console.log("       Hedera LangGraph Agent Setup Helper");
console.log("=================================================");
console.log("This script will help you set up the Hedera LangGraph Agent");
console.log("You'll need the following information ready:");
console.log("- OpenAI API key");
console.log("- Hedera account ID");
console.log("- Hedera private key");
console.log("- Hedera network (testnet, mainnet, or previewnet)");
console.log("=================================================\n");

const envFile = path.join(__dirname, '.env');

// Check if .env already exists
if (fs.existsSync(envFile)) {
  console.log("An .env file already exists. Do you want to overwrite it? (yes/no)");
  rl.question("> ", (answer) => {
    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
      promptForEnvVariables();
    } else {
      console.log("Setup canceled. Existing .env file kept.");
      rl.close();
    }
  });
} else {
  promptForEnvVariables();
}

function promptForEnvVariables() {
  rl.question("Enter your OpenAI API key: ", (openaiKey) => {
    rl.question("Enter your Hedera account ID: ", (accountId) => {
      rl.question("Enter your Hedera private key: ", (privateKey) => {
        rl.question("Enter your Hedera network (testnet, mainnet, or previewnet) [default: testnet]: ", (network) => {
          // Use testnet as default if no input provided
          const hederaNetwork = network || 'testnet';
          
          // Create .env file
          const envContent = `# Hedera credentials
HEDERA_ACCOUNT_ID=${accountId}
HEDERA_PRIVATE_KEY=${privateKey}
HEDERA_NETWORK=${hederaNetwork}

# OpenAI API key for the LangGraph agent
OPENAI_API_KEY=${openaiKey}`;

          fs.writeFileSync(envFile, envContent);
          console.log("\n.env file created successfully!");
          
          // Check if dependencies are installed
          console.log("\nChecking dependencies...");
          try {
            checkAndInstallDependencies();
            console.log("\nSetup complete! You can now run the agent with:");
            console.log("npm run agent");
            rl.close();
          } catch (error) {
            console.error("Error installing dependencies:", error);
            console.log("Please run 'npm install' manually to ensure all dependencies are installed.");
            rl.close();
          }
        });
      });
    });
  });
}

function checkAndInstallDependencies() {
  try {
    // Check if node_modules exists
    if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
      console.log("Installing dependencies (this may take a minute)...");
      execSync('npm install', { stdio: 'inherit' });
    } else {
      console.log("Dependencies already installed.");
    }
  } catch (error) {
    throw new Error(`Failed to install dependencies: ${error.message}`);
  }
} 