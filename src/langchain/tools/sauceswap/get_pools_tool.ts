import { Tool, ToolRunnableConfig } from "@langchain/core/tools";
import HederaAgentKit from "../../../agent";
import { CallbackManagerForToolRun } from "@langchain/core/callbacks/manager";
import { SaucerSwapPool } from "../../../types";

// In-memory storage for pools data to enable pagination
class PoolsCache {
  private static instance: PoolsCache;
  private cache: Map<string, SaucerSwapPool[]> = new Map();

  private constructor() {}

  public static getInstance(): PoolsCache {
    if (!PoolsCache.instance) {
      PoolsCache.instance = new PoolsCache();
    }
    return PoolsCache.instance;
  }

  public set(sessionId: string, pools: SaucerSwapPool[]): void {
    this.cache.set(sessionId, pools);
  }

  public get(sessionId: string): SaucerSwapPool[] | undefined {
    return this.cache.get(sessionId);
  }

  public clear(sessionId: string): void {
    this.cache.delete(sessionId);
  }

  public getPage(sessionId: string, page: number, pageSize: number): SaucerSwapPool[] {
    const pools = this.cache.get(sessionId);
    if (!pools) return [];

    const startIdx = (page - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    return pools.slice(startIdx, endIdx);
  }

  public getPageCount(sessionId: string, pageSize: number): number {
    const pools = this.cache.get(sessionId);
    if (!pools) return 0;

    return Math.ceil(pools.length / pageSize);
  }

  public getTotalCount(sessionId: string): number {
    const pools = this.cache.get(sessionId);
    return pools ? pools.length : 0;
  }
}

export class SauceSwapPoolsTool extends Tool {
  name = "sauceswap_get_pools";

  description = `Fetches all available pools from SaucerSwap with their token information and liquidity data.
Inputs (input is a JSON string):
- **page** (*number*, optional): Page number to retrieve. Default: 1.
- **pageSize** (*number*, optional): Number of pools per page. Default: 10.
- **refresh** (*boolean*, optional): Force refresh data from API instead of cache. Default: false.
- **filter** (*string*, optional): Filter pools by token symbol (e.g. "HBAR" to get only HBAR pools). Default: none.

Example usage:
Get first page of pools (10 pools per page):
'{
  "page": 1,
  "pageSize": 10
}'

Get second page with smaller page size (5 pools):
'{
  "page": 2,
  "pageSize": 5
}'

Get only HBAR pools:
'{
  "filter": "HBAR"
}'`;

  private poolsCache = PoolsCache.getInstance();

  constructor(private hederaKit: HederaAgentKit) {
    super();
  }

  protected override async _call(input: any, _runManager?: CallbackManagerForToolRun, config?: ToolRunnableConfig): Promise<string> {
    try {
      const isCustodial = config?.configurable?.isCustodial === true;
      // Use a stable session ID based on the accountId to maintain cache between calls
      const sessionId = this.hederaKit.accountId || "default";
      
      console.log(`sauceswap_get_pools tool has been called (${isCustodial ? 'custodial' : 'non-custodial'})`);

      // Parse the input
      const parsedInput = typeof input === 'string' ? JSON.parse(input) : input;
      const { 
        page = 1, 
        pageSize = 10, 
        refresh = false,
        filter = ""
      } = parsedInput;
      
      // Validate page and pageSize
      if (page < 1 || pageSize < 1 || pageSize > 100) {
        return JSON.stringify({
          status: "error",
          message: "Invalid pagination parameters. Page must be >= 1 and pageSize must be between 1 and 100."
        });
      }

      let allPools: SaucerSwapPool[] = [];
      
      // Check cache first unless refresh is requested
      if (!refresh && this.poolsCache.get(sessionId)) {
        allPools = this.poolsCache.get(sessionId) || [];
        console.log(`Using cached pools data. Total pools: ${allPools.length}`);
      } else {
        // Fetch new data from API
        console.log("Fetching fresh pools data from SaucerSwap API...");
        allPools = await this.hederaKit.getSauceSwapPools();
        
        // Store in cache
        this.poolsCache.set(sessionId, allPools);
        console.log(`Cached ${allPools.length} pools for future use`);
      }
      
      // Apply filter if provided
      let filteredPools = allPools;
      if (filter) {
        const filterLower = filter.toLowerCase();
        filteredPools = allPools.filter(pool => 
          pool.tokenA.symbol.toLowerCase().includes(filterLower) || 
          pool.tokenB.symbol.toLowerCase().includes(filterLower) ||
          pool.lpToken.symbol.toLowerCase().includes(filterLower)
        );
        console.log(`Applied filter "${filter}". Filtered pools: ${filteredPools.length}`);
      }

      // Calculate pagination
      const totalCount = filteredPools.length;
      const totalPages = Math.ceil(totalCount / pageSize);
      
      // Ensure page is within bounds
      const validPage = Math.min(page, totalPages || 1);
      
      // Get the page of data
      const startIdx = (validPage - 1) * pageSize;
      const endIdx = Math.min(startIdx + pageSize, totalCount);
      const poolsPage = filteredPools.slice(startIdx, endIdx);

      return JSON.stringify({
        status: "success",
        message: "SaucerSwap pools retrieved successfully",
        pagination: {
          page: validPage,
          pageSize,
          totalPages,
          totalCount,
          hasNextPage: validPage < totalPages,
          hasPreviousPage: validPage > 1
        },
        filter: filter || null,
        data: poolsPage
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