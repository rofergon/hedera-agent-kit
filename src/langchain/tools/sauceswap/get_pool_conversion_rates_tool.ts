import { Tool, ToolRunnableConfig } from "@langchain/core/tools";
import HederaAgentKit from "../../../agent";
import { CallbackManagerForToolRun } from "@langchain/core/callbacks/manager";

export class SauceSwapPoolConversionRatesTool extends Tool {
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
}'

Get conversion rates for pool 213 with daily interval and inverted:
'{
  "poolId": "213",
  "interval": "DAY",
  "inverted": true
}'`;

  constructor(private hederaKit: HederaAgentKit) {
    super();
  }

  protected override async _call(input: any, _runManager?: CallbackManagerForToolRun, config?: ToolRunnableConfig): Promise<string> {
    try {
      const isCustodial = config?.configurable?.isCustodial === true;
      console.log(`sauceswap_get_pool_conversion_rate tool has been called (${isCustodial ? 'custodial' : 'non-custodial'})`);

      // Parse the input
      const parsedInput = typeof input === 'string' ? JSON.parse(input) : input;
      const { poolId, interval = "HOUR", inverted = false } = parsedInput;
      
      if (!poolId) {
        return JSON.stringify({
          status: "error",
          message: "Pool ID is required"
        });
      }

      // Validate interval
      const validIntervals = ["FIVEMIN", "HOUR", "DAY", "WEEK"];
      if (!validIntervals.includes(interval)) {
        return JSON.stringify({
          status: "error",
          message: `Invalid interval. Valid options: ${validIntervals.join(", ")}`
        });
      }

      // Use the HederaAgentKit method to get the pool rates
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