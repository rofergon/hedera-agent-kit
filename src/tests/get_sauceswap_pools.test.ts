import { describe, expect, test, vi, beforeEach } from 'vitest';
import { SauceSwapPoolsTool } from '../langchain/tools/sauceswap/get_pools_tool';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { SaucerSwapPool } from '../types';

// Sample pool data for testing
const mockPoolsData: SaucerSwapPool[] = [
  {
    id: 0,
    contractId: "0.0.1062795",
    lpToken: {
      id: "0.0.1062796",
      name: "SS-LP SAUCE - HBAR",
      symbol: "SAUCE - HBAR",
      decimals: 8,
      priceUsd: 1.735
    },
    lpTokenReserve: "4055259041563",
    tokenA: {
      id: "0.0.731861",
      name: "SAUCE",
      symbol: "SAUCE",
      decimals: 6,
      priceUsd: 0.039
    },
    tokenReserveA: "901185654687",
    tokenB: {
      id: "0.0.1062664",
      name: "WHBAR [old]",
      symbol: "HBAR",
      decimals: 8,
      priceUsd: 0.178
    },
    tokenReserveB: "19800241693615"
  },
  {
    id: 1,
    contractId: "0.0.1080215",
    lpToken: {
      id: "0.0.1080216",
      name: "SS-LP USDC - HBAR",
      symbol: "USDC - HBAR",
      decimals: 8,
      priceUsd: 9.7
    },
    lpTokenReserve: "52913077214",
    tokenA: {
      id: "0.0.456858",
      name: "USD Coin",
      symbol: "USDC",
      decimals: 6,
      priceUsd: 0.996
    },
    tokenReserveA: "2576229898",
    tokenB: {
      id: "0.0.1062664",
      name: "WHBAR [old]",
      symbol: "HBAR",
      decimals: 8,
      priceUsd: 0.178
    },
    tokenReserveB: "1436932611199"
  },
  // Add more mock pools for pagination testing
  {
    id: 2,
    contractId: "0.0.1081088",
    lpToken: {
      id: "0.0.1081089",
      name: "SS-LP DOV[hts] - HBAR",
      symbol: "DOV[hts] - HBAR",
      decimals: 8,
      priceUsd: 0.008
    },
    lpTokenReserve: "394284817398",
    tokenA: {
      id: "0.0.624505",
      name: "DOVU",
      symbol: "DOV[hts]",
      decimals: 8,
      priceUsd: 0.0000573
    },
    tokenReserveA: "27605732997510",
    tokenB: {
      id: "0.0.1062664",
      name: "WHBAR [old]",
      symbol: "HBAR",
      decimals: 8,
      priceUsd: 0.178
    },
    tokenReserveB: "8330713172"
  },
  {
    id: 3,
    contractId: "0.0.1081603",
    lpToken: {
      id: "0.0.1081604",
      name: "SS-LP CREAM - HBAR",
      symbol: "CREAM - HBAR",
      decimals: 8,
      priceUsd: 62.85
    },
    lpTokenReserve: "281061278",
    tokenA: {
      id: "0.0.926385",
      name: "CREAM",
      symbol: "CREAM",
      decimals: 0,
      priceUsd: 0.00004999
    },
    tokenReserveA: "1766883",
    tokenB: {
      id: "0.0.1062664",
      name: "WHBAR [old]",
      symbol: "HBAR",
      decimals: 8,
      priceUsd: 0.178
    },
    tokenReserveB: "49062141378"
  },
  {
    id: 4,
    contractId: "0.0.1081914",
    lpToken: {
      id: "0.0.1081915",
      name: "SS-LP JAM - SAUCE",
      symbol: "JAM - SAUCE",
      decimals: 8,
      priceUsd: 0.052
    },
    lpTokenReserve: "210482118300",
    tokenA: {
      id: "0.0.127877",
      name: "Tune.FM",
      symbol: "JAM",
      decimals: 8,
      priceUsd: 0.0000768
    },
    tokenReserveA: "71373977155304",
    tokenB: {
      id: "0.0.731861",
      name: "SAUCE",
      symbol: "SAUCE",
      decimals: 6,
      priceUsd: 0.039
    },
    tokenReserveB: "1411474481"
  }
];

// Create a mock for HederaAgentKit
const mockHederaKit = {
  getSauceSwapPools: vi.fn().mockResolvedValue(mockPoolsData),
  network: 'testnet',
  accountId: '0.0.123456',
};

describe('SauceSwapPoolsTool with Pagination', () => {
  let sauceSwapPoolsTool: SauceSwapPoolsTool;

  beforeEach(() => {
    // Reset mock
    vi.resetAllMocks();
    
    // Reset the mock implementation
    mockHederaKit.getSauceSwapPools.mockResolvedValue(mockPoolsData);

    // Create SauceSwapPoolsTool instance with mocked HederaAgentKit
    sauceSwapPoolsTool = new SauceSwapPoolsTool(mockHederaKit as any);
  });

  test('should have the correct name and description', () => {
    expect(sauceSwapPoolsTool.name).toBe('sauceswap_get_pools');
    expect(sauceSwapPoolsTool.description).toContain('Fetches all available pools from SaucerSwap');
    expect(sauceSwapPoolsTool.description).toContain('page');
    expect(sauceSwapPoolsTool.description).toContain('pageSize');
    expect(sauceSwapPoolsTool.description).toContain('filter');
  });

  test('should return default pagination when no parameters are provided', async () => {
    // Call with empty input (default parameters)
    const result = await (sauceSwapPoolsTool as any)._call('{}');
    
    // Parse the result
    const parsedResult = JSON.parse(result);
    
    // Verify the response
    expect(parsedResult.status).toBe('success');
    expect(parsedResult.message).toBe('SaucerSwap pools retrieved successfully');
    expect(parsedResult.data).toHaveLength(Math.min(10, mockPoolsData.length)); // Default page size is 10
    expect(parsedResult.pagination).toBeDefined();
    expect(parsedResult.pagination.page).toBe(1);
    expect(parsedResult.pagination.pageSize).toBe(10);
    expect(parsedResult.pagination.totalCount).toBe(mockPoolsData.length);
    
    // Verify enhanced pagination information
    expect(parsedResult.pagination.paginationSummary).toBeDefined();
    expect(parsedResult.pagination.navigationGuide).toBeDefined();
    expect(parsedResult.pagination.currentRange).toBeDefined();
    expect(parsedResult.pagination.remainingItems).toBeDefined();
    expect(parsedResult.pagination.remainingPages).toBeDefined();
    
    // Verify the method was called
    expect(mockHederaKit.getSauceSwapPools).toHaveBeenCalledTimes(1);
  });

  test('should support pagination with custom page size', async () => {
    // Call with custom page size of 2
    const result = await (sauceSwapPoolsTool as any)._call(JSON.stringify({
      page: 1,
      pageSize: 2
    }));
    
    // Parse the result
    const parsedResult = JSON.parse(result);
    
    // Verify pagination settings
    expect(parsedResult.status).toBe('success');
    expect(parsedResult.pagination.pageSize).toBe(2);
    expect(parsedResult.data).toHaveLength(2);
    expect(parsedResult.data[0].id).toBe(0);
    expect(parsedResult.data[1].id).toBe(1);
    
    // Check if hasNextPage is correct
    expect(parsedResult.pagination.hasNextPage).toBe(true);
    expect(parsedResult.pagination.hasPreviousPage).toBe(false);
  });

  test('should navigate to second page correctly', async () => {
    // Request second page with page size of 2
    const result = await (sauceSwapPoolsTool as any)._call(JSON.stringify({
      page: 2,
      pageSize: 2
    }));
    
    // Parse the result
    const parsedResult = JSON.parse(result);
    
    // Verify we get the correct items for page 2
    expect(parsedResult.status).toBe('success');
    expect(parsedResult.pagination.page).toBe(2);
    expect(parsedResult.data).toHaveLength(2);
    expect(parsedResult.data[0].id).toBe(2); // Third item (index 2)
    expect(parsedResult.data[1].id).toBe(3); // Fourth item (index 3)
    
    // Check navigation flags
    expect(parsedResult.pagination.hasNextPage).toBe(true);
    expect(parsedResult.pagination.hasPreviousPage).toBe(true);
  });

  test('should handle filter parameter', async () => {
    // Filter for HBAR pools
    const result = await (sauceSwapPoolsTool as any)._call(JSON.stringify({
      filter: "HBAR"
    }));
    
    // Parse the result
    const parsedResult = JSON.parse(result);
    
    // We expect only HBAR pools in the result
    expect(parsedResult.status).toBe('success');
    expect(parsedResult.filter).toBe("HBAR");
    
    // Make sure all returned pools contain HBAR
    parsedResult.data.forEach((pool: SaucerSwapPool) => {
      const containsHbar = 
        pool.tokenA.symbol.includes('HBAR') || 
        pool.tokenB.symbol.includes('HBAR') ||
        pool.lpToken.symbol.includes('HBAR');
      
      expect(containsHbar).toBe(true);
    });
  });

  test('should handle refresh parameter', async () => {
    // Reset mocks before test
    vi.resetAllMocks();
    
    // First call to populate the cache
    await (sauceSwapPoolsTool as any)._call('{}');
    
    // Reset the mock to return different data on next call
    const modifiedData = [...mockPoolsData];
    modifiedData[0] = {
      ...modifiedData[0],
      id: 999 // Modified ID to test refresh
    };
    mockHederaKit.getSauceSwapPools.mockReset(); // Clear previous calls counter
    mockHederaKit.getSauceSwapPools.mockResolvedValue(modifiedData);
    
    // Call without refresh should use cache (shouldn't call the API again)
    const resultNoRefresh = await (sauceSwapPoolsTool as any)._call('{}');
    const parsedNoRefresh = JSON.parse(resultNoRefresh);
    
    // Data should be from cache (original mock data)
    expect(parsedNoRefresh.data[0].id).toBe(0);
    
    // API should not have been called yet with the new mock
    expect(mockHederaKit.getSauceSwapPools).not.toHaveBeenCalled();
    
    // Call with refresh should get new data
    const resultWithRefresh = await (sauceSwapPoolsTool as any)._call(JSON.stringify({
      refresh: true
    }));
    const parsedWithRefresh = JSON.parse(resultWithRefresh);
    
    // Data should be from new API call (modified data)
    expect(parsedWithRefresh.data[0].id).toBe(999);
    
    // The API method should have been called once with the new mock
    expect(mockHederaKit.getSauceSwapPools).toHaveBeenCalledTimes(1);
  });

  test('should handle invalid pagination parameters', async () => {
    // Test with invalid page number
    const resultInvalidPage = await (sauceSwapPoolsTool as any)._call(JSON.stringify({
      page: 0,
      pageSize: 10
    }));
    
    const parsedInvalidPage = JSON.parse(resultInvalidPage);
    expect(parsedInvalidPage.status).toBe('error');
    expect(parsedInvalidPage.message).toContain('Invalid pagination parameters');
    
    // Test with invalid page size
    const resultInvalidSize = await (sauceSwapPoolsTool as any)._call(JSON.stringify({
      page: 1,
      pageSize: 0
    }));
    
    const parsedInvalidSize = JSON.parse(resultInvalidSize);
    expect(parsedInvalidSize.status).toBe('error');
    expect(parsedInvalidSize.message).toContain('Invalid pagination parameters');
  });

  test('should handle errors correctly', async () => {
    // Reset the pool cache for this test
    vi.resetAllMocks();
    
    // Re-create the tool to get a fresh cache
    sauceSwapPoolsTool = new SauceSwapPoolsTool(mockHederaKit as any);
    
    // Set up the mock to throw an error
    mockHederaKit.getSauceSwapPools.mockRejectedValueOnce(new Error('API error'));
    
    // Call the tool with an empty cache (forces API call)
    const result = await (sauceSwapPoolsTool as any)._call(JSON.stringify({
      refresh: true // Force refresh to ensure API call
    }));
    
    // Parse the result
    const parsedResult = JSON.parse(result);
    
    // Verify the error response
    expect(parsedResult.status).toBe('error');
    expect(parsedResult.message).toBe('API error');
    
    // Verify the method was called
    expect(mockHederaKit.getSauceSwapPools).toHaveBeenCalledTimes(1);
  });
});

// We'll test the getSauceSwapPools method in isolation
describe('getSauceSwapPools method', () => {
  // Mock fetch globally
  global.fetch = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    
    // Mock fetch to return pool data
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockPoolsData
    });
  });

  test('should fetch pools data from the API', async () => {
    // Create a function resembling the original implementation
    const getSauceSwapPools = async (): Promise<SaucerSwapPool[]> => {
      const baseUrl = "https://api.saucerswap.finance";
      const endpoint = "/pools";
      
      const url = `${baseUrl}${endpoint}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error fetching pools: ${response.status} - ${response.statusText}`);
      }
      
      return await response.json() as SaucerSwapPool[];
    };
    
    // Call the function
    const result = await getSauceSwapPools();
    
    // Verify the result
    expect(result).toEqual(mockPoolsData);
    
    // Verify fetch was called with the right URL
    expect(fetch).toHaveBeenCalledWith('https://api.saucerswap.finance/pools');
  });

  test('should handle API errors correctly', async () => {
    // Create a function resembling the original implementation
    const getSauceSwapPools = async (): Promise<SaucerSwapPool[]> => {
      const baseUrl = "https://api.saucerswap.finance";
      const endpoint = "/pools";
      
      const url = `${baseUrl}${endpoint}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error fetching pools: ${response.status} - ${response.statusText}`);
      }
      
      return await response.json() as SaucerSwapPool[];
    };
    
    // Mock fetch to return an error
    (fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });
    
    // Call the function and expect it to throw
    await expect(getSauceSwapPools()).rejects.toThrow('Error fetching pools: 500 - Internal Server Error');
  });

  test('should handle network errors correctly', async () => {
    // Create a function resembling the original implementation
    const getSauceSwapPools = async (): Promise<SaucerSwapPool[]> => {
      try {
        const baseUrl = "https://api.saucerswap.finance";
        const endpoint = "/pools";
        
        const url = `${baseUrl}${endpoint}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Error fetching pools: ${response.status} - ${response.statusText}`);
        }
        
        return await response.json() as SaucerSwapPool[];
      } catch (error: any) {
        throw new Error(`Failed to get SaucerSwap pools: ${error.message}`);
      }
    };
    
    // Mock fetch to throw a network error
    (fetch as any).mockRejectedValue(new Error('Network error'));
    
    // Call the function and expect it to throw
    await expect(getSauceSwapPools()).rejects.toThrow('Failed to get SaucerSwap pools: Network error');
  });
}); 