# Custodial vs Non-Custodial Transactions in Hedera Agent Kit

## Overview

The Hedera Agent Kit supports two modes of operation for transactions: **custodial** and **non-custodial**. This document explains the differences and how to use each mode.

## Custodial Mode

In **custodial mode**, the agent has access to your private key and can sign and submit transactions to the Hedera network directly.

### How It Works

1. The agent creates the transaction
2. The agent signs it using your private key (stored in `.env`)
3. The agent submits it to the network
4. The transaction is processed and you receive the transaction ID, status, and receipt

### When to Use

Use custodial mode when:
- You're building a backend service that manages tokens or sends transactions on behalf of your application
- You need fully automated transactions without user intervention
- You're working in a secure environment and are comfortable storing private keys

### Example Results

When a custodial transaction is successful, you'll receive a result like:

```json
{
  "status": "success",
  "message": "Token created",
  "txHash": "0.0.14560992@1681935507.632970236",
  "tokenId": "0.0.14560993"
}
```

## Non-Custodial Mode

In **non-custodial mode**, the agent only creates and returns transaction bytes, which must be signed externally before being submitted to the network.

### How It Works

1. The agent creates the transaction
2. The agent returns the transaction bytes as a string
3. The client application must:
   - Sign the transaction bytes using the appropriate private key
   - Submit the signed transaction to the Hedera network
   - Process the receipt

### When to Use

Use non-custodial mode when:
- Building client applications where users manage their own keys
- Integrating with external wallet services
- Working in environments where private keys should never be shared with a third party
- Creating a more secure separation of transaction creation and signing

### Example Results

When a non-custodial transaction is created, you'll receive a result like:

```json
{
  "status": "success",
  "txBytes": "CnwqegpzChoKDAjOkabABhDJtv2uAhIJCAAQABiO++UCGAASBggAEAAYCBiAvMGWCyICCHgyAOoBQgoHU0FCUklOQRIDU0JSGAQgwJaxAioJCAAQABiO++UCaggI09+AxAYQAHIJCAAQABiO++UCegUIgM7aA4gBALoBABIA...",
  "message": "Create token transaction bytes have been successfully created."
}
```

## How to Specify Transaction Mode

### In the Hedera Agent Kit API

When using the Hedera Agent Kit directly in your code, you can specify the mode for each transaction:

```typescript
// Non-custodial (default)
const result = await hederaAgent.createFT(options);

// Explicitly non-custodial
const result = await hederaAgent.createFT(options, false);

// Custodial
const result = await hederaAgent.createFT(options, true);
```

### In the LangGraph Agent

The LangGraph agent we've built automatically uses the custodial mode for all transactions thanks to the `CustomToolNode` class, which sets the `isCustodial` configuration parameter to `true`.

If you want to modify this behavior:

1. You can edit the `CustomToolNode` class in `hedera-agent.ts` to disable custodial mode by default
2. You can modify the system message to instruct the agent to use non-custodial mode for certain operations

## Security Considerations

### Custodial Mode

- Requires storage of private keys in an environment variable or configuration file
- Provides convenience at the cost of security
- Suitable for trusted environments, testing, and backend services
- Not recommended for client-side applications

### Non-Custodial Mode

- More secure as private keys remain under user control
- Requires additional client-side code to handle signing and submission
- Better aligns with blockchain security principles
- Recommended for production applications with direct user interaction

## Conclusion

Choose the transaction mode that best fits your security requirements and application architecture. For maximum security, prefer non-custodial mode whenever possible. 