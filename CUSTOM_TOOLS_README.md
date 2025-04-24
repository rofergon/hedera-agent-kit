# Adding Custom Tools to Hedera Agent Kit

This guide explains how to extend the Hedera Agent Kit by adding custom tools for integrating with external APIs and services.

## Overview

The Hedera Agent Kit uses a LangChain/LangGraph architecture where tools are defined as classes that extend the LangChain `Tool` class. These tools can be integrated into the agent to enable interactions with external services like SaucerSwap, DeFi platforms, or any other API.

## Steps to Add a Custom Tool

### 1. Create a Type Definition

First, define the types for your tool's input and output in `src/types/index.ts`:

```typescript
// Add your custom types
export type SaucerSwapPoolConversionRate = {
    id: number;
    poolId: number;
    open: number;
    high: number;
    low: number;
    close: number;
    avg: number;
    volume: string;
    liquidity: string;
    volumeUsd: string;
    liquidityUsd: string;
    timestampSeconds: number;
    startTimestampSeconds: number;
};
```

### 2. Add a Method to HederaAgentKit

Implement your API call functionality in `src/agent/index.ts`:

```typescript
/**
 * Gets the conversion rates for a SaucerSwap pool
 * @param poolId The ID of the pool to get rates for
 * @param interval The time interval (FIVEMIN, HOUR, DAY, WEEK)
 * @param inverted Whether to invert the conversion rate
 * @returns The pool conversion rate data
 */
async getSauceSwapPoolRates(
    poolId: string | number, 
    interval: string = 'HOUR',
    inverted: boolean = false
): Promise<SaucerSwapPoolConversionRate> {
    const baseUrl = "https://api.saucerswap.finance";
    const endpoint = `/pools/conversionRates/latest/${poolId}`;
    
    // Build URL with query parameters
    const queryParams = new URLSearchParams();
    queryParams.append("interval", interval);
    if (inverted) {
        queryParams.append("inverted", "true");
    }
    
    const url = `${baseUrl}${endpoint}?${queryParams.toString()}`;
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Error fetching pool conversion rates: ${response.status} - ${response.statusText}`);
        }
        
        return await response.json() as SaucerSwapPoolConversionRate;
    } catch (error: any) {
        throw new Error(`Failed to get SaucerSwap pool rates: ${error.message}`);
    }
}
```

### 3. Create the Tool Implementation

Create a new file for your tool in the appropriate directory:

```
src/langchain/tools/[category]/your_tool_name.ts
```

For example, for a SaucerSwap tool:

```typescript
// src/langchain/tools/sauceswap/get_pool_conversion_rates_tool.ts
import { Tool, ToolRunnableConfig } from "@langchain/core/tools";
import HederaAgentKit from "../../../agent";
import { CallbackManagerForToolRun } from "@langchain/core/callbacks/manager";

export class SauceSwapPoolConversionRatesTool extends Tool {
  // IMPORTANT: Tool name must match pattern ^[a-zA-Z0-9_-]+$
  // Do NOT use periods (.) in tool names!
  name = "sauceswap_get_pool_conversion_rate";

  description = `Fetches the latest conversion rates for a SaucerSwap pool.
Inputs (input is a JSON string):
- **poolId** (*string*, required): The ID of the SaucerSwap pool to fetch conversion rates for.
- **interval** (*string*, optional): Data interval. Options: FIVEMIN, HOUR, DAY, WEEK. Default: HOUR.
- **inverted** (*boolean*, optional): Whether to invert the conversion rate. Default: false.

Example usage:
Get conversion rates for pool 1 with hourly interval:
'{
  "poolId": "1",
  "interval": "HOUR"
}'`;

  constructor(private hederaKit: HederaAgentKit) {
    super();
  }

  protected override async _call(input: any, _runManager?: CallbackManagerForToolRun, config?: ToolRunnableConfig): Promise<string> {
    try {
      const isCustodial = config?.configurable?.isCustodial === true;
      console.log(`${this.name} tool has been called (${isCustodial ? 'custodial' : 'non-custodial'})`);

      // Parse the input
      const parsedInput = typeof input === 'string' ? JSON.parse(input) : input;
      const { poolId, interval = "HOUR", inverted = false } = parsedInput;
      
      if (!poolId) {
        return JSON.stringify({
          status: "error",
          message: "Pool ID is required"
        });
      }

      // Use the HederaAgentKit method to get the data
      const data = await this.hederaKit.getSauceSwapPoolRates(poolId, interval, inverted);
      
      return JSON.stringify({
        status: "success",
        message: "Pool conversion rates retrieved",
        data: data
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message || "Unknown error occurred",
        code: error.code || "UNKNOWN_ERROR"
      });
    }
  }
}
```

### 4. Register the Tool

Update `src/langchain/index.ts` to import and include your tool:

```typescript
import { SauceSwapPoolConversionRatesTool } from "./tools/sauceswap/get_pool_conversion_rates_tool";

// ...

export function createHederaTools(hederaKit: HederaAgentKit): Tool[] {
  const tools = [
    // Existing tools...
    new SauceSwapPoolConversionRatesTool(hederaKit),
  ];
  
  return tools;
}
```

### 5. Update Agent Instructions

Update the agent's system message in `hedera-agent.ts` to include information about your new tool:

```typescript
const systemMessage = new SystemMessage(
  `You are a helpful assistant specialized in Hedera blockchain operations.
You have access to the following Hedera tools:
// ...
- SaucerSwap tools: Get pool conversion rates using the sauceswap_get_pool_conversion_rate tool

For SaucerSwap queries:
- To get pool conversion rates, use the sauceswap_get_pool_conversion_rate tool with a poolId parameter
// ...`
);
```

### 6. Add Action in Types (Optional)

If needed, add an action name in `src/types/index.ts`:

```typescript
export enum AgentKitActionName {
    // Existing actions...
    GET_SAUCESWAP_POOL_RATES_CUSTODIAL = 'getSauceSwapPoolRatesCustodial',
    GET_SAUCESWAP_POOL_RATES_NON_CUSTODIAL = 'getSauceSwapPoolRatesNonCustodial',
}
```

## Important Notes

1. **Tool Naming**: Tool names must match the pattern `^[a-zA-Z0-9_-]+$`. Do NOT use periods (.) in tool names as this will cause errors with OpenAI's API.

2. **Local vs. NPM Package**: If you're developing with the local version of Hedera Agent Kit, make sure to import from the local paths:

   ```typescript
   // Use local imports instead of the npm package
   import HederaAgentKit from './src/agent';
   import { createHederaTools } from './src/langchain';
   // Instead of:
   // import { HederaAgentKit, createHederaTools } from 'hedera-agent-kit';
   ```

3. **Tool Interface**: Custom tools should implement the correct interface including:
   - Proper error handling
   - Use of `ToolRunnableConfig` to access custodial mode
   - JSON response formatting

4. **Testing**: Always test your tools thoroughly before deployment:

   ```
   npm run build
   npm run agent
   ```

## Troubleshooting

- **Tool Not Found**: Check that the tool name matches exactly in all places it's referenced
- **Invalid Tool Name**: Ensure the tool name follows the pattern `^[a-zA-Z0-9_-]+$`
- **Type Errors**: Make sure all types are properly defined and imported
- **Runtime Errors**: Check for proper error handling in your tool implementation
- **Missing in Tools List**: Verify that the tool is properly registered in `createHederaTools()` 