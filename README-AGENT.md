# Hedera LangGraph Agent

This is a conversational AI agent built with LangGraph that can interact with the Hedera blockchain through natural language.

## Features

- Interactive chat interface in the terminal
- Uses LangGraph for an intelligent agent workflow
- Connects to the Hedera blockchain using the Hedera Agent Kit
- Can perform a variety of Hedera operations through conversation:
  - Check account balances
  - Create and manage tokens
  - Transfer HBAR and tokens
  - Create and manage topics
  - Submit messages to topics
  - And more!

## Prerequisites

- Node.js v18 or later
- An OpenAI API key
- A Hedera account (account ID and private key)
- Hedera network access (mainnet, testnet, or previewnet)

## Installation

1. Clone this repository
2. Run the setup script to configure the agent:
   ```
   npm run setup
   ```
   This will:
   - Prompt you for your OpenAI API key, Hedera account ID, private key, and network
   - Create a `.env` file with your credentials
   - Check and install necessary dependencies

3. Alternatively, you can set up manually:
   - Install dependencies: `npm install`
   - Create a `.env` file in the root directory with the following variables:
     ```
     OPENAI_API_KEY=your_openai_api_key
     HEDERA_ACCOUNT_ID=your_hedera_account_id
     HEDERA_PRIVATE_KEY=your_hedera_private_key
     HEDERA_NETWORK=testnet  # or mainnet or previewnet
     ```

## Usage

Run the agent with the following command:

```
npm run agent
```

You'll be presented with a chat interface where you can make requests to the agent in natural language. For example:

- "What is my HBAR balance?"
- "Create a new fungible token called 'Test Token' with symbol 'TEST'"
- "Transfer 5 HBAR to account 0.0.12345"
- "Get all my token balances"
- "Create a new topic with memo 'Test Topic'"
- "Submit a message to topic 0.0.12345 saying 'Hello, Hedera!'"

Type `exit` to quit the application.

## Available Tools

The agent has access to the following Hedera tools:

- **HBAR**: Check balance, transfer HBAR
- **HTS (Hedera Token Service)**: Create tokens (fungible and non-fungible), check balances, transfer tokens, associate/dissociate tokens, mint tokens, etc.
- **HCS (Hedera Consensus Service)**: Create topics, submit messages, get topic info, get messages

## Examples

Here are some sample conversations:

```
You: What is my HBAR balance?
Agent: Your HBAR balance is 100.5.

You: Create a fungible token named "Demo Token" with symbol "DEMO"
Agent: I've created a new fungible token named "Demo Token" with symbol "DEMO". The token ID is 0.0.1234567.

You: Transfer 10 DEMO tokens to account 0.0.12345
Agent: I've transferred 10 DEMO tokens to account 0.0.12345. The transaction was successful.
```

## Architecture

This agent uses the ReAct (Reason + Act) pattern implemented with LangGraph:
1. The agent receives a user query
2. It reasons about which Hedera tool to use
3. It executes the appropriate tool
4. It observes the result
5. It continues this cycle until it can provide a complete answer to the user

The agent maintains conversation context, allowing for follow-up questions and complex interactions. 