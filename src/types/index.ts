import BigNumber from "bignumber.js";
import { CreateTokenOptions } from "../tools/transactions/strategies";

export type HederaNetworkType = "mainnet" | "testnet" | "previewnet";

// SaucerSwap Types
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

export type SaucerSwapPool = {
    id: number;
    contractId: string;
    lpToken: {
        id: string;
        name: string;
        symbol: string;
        decimals: number;
        priceUsd: number;
    };
    lpTokenReserve: string;
    tokenA: {
        id: string;
        name: string;
        symbol: string;
        decimals: number;
        priceUsd: number;
    };
    tokenReserveA: string;
    tokenB: {
        id: string;
        name: string;
        symbol: string;
        decimals: number;
        priceUsd: number;
    };
    tokenReserveB: string;
};

export type TokenBalance = {
    account: string;
    balance: number;
    decimals: number;
};

export type TokenHoldersBalancesApiResponse = {
    timestamp: string;
    balances: TokenBalance[];
    links: {
        next: string; // link to the next page
    };
};

export type DetailedTokenBalance= {
    tokenId: string;
    tokenSymbol: string;
    tokenName: string;
    tokenDecimals: string;
    balance: number;
    balanceInDisplayUnit: BigNumber;
}

export type HtsTokenBalanceApiReponse = {
    timestamp: string;
    balances: TokenBalance[];
    links: {
        next: string;
    };
};

type ProtobufEncodedKey = {
    _type: "ProtobufEncoded";
    key: string;
};

type CustomFees = {
    created_timestamp: string;
    fixed_fees: any[];
    fractional_fees: any[];
};

export type HtsTokenDetails = {
    admin_key: ProtobufEncodedKey;
    auto_renew_account: string;
    auto_renew_period: number;
    created_timestamp: string;
    custom_fees: CustomFees;
    decimals: string;
    deleted: boolean;
    expiry_timestamp: number;
    fee_schedule_key: ProtobufEncodedKey;
    freeze_default: boolean;
    freeze_key: ProtobufEncodedKey;
    initial_supply: string;
    kyc_key: ProtobufEncodedKey;
    max_supply: string;
    memo: string;
    metadata: string;
    metadata_key: ProtobufEncodedKey | null;
    modified_timestamp: string;
    name: string;
    pause_key: ProtobufEncodedKey;
    pause_status: "PAUSED" | "UNPAUSED";
    supply_key: ProtobufEncodedKey;
    supply_type: "FINITE" | "INFINITE";
    symbol: string;
    token_id: string;
    total_supply: string;
    treasury_account_id: string;
    type: "FUNGIBLE_COMMON" | "NON_FUNGIBLE_UNIQUE";
    wipe_key: ProtobufEncodedKey;
};

export type AllTokensBalancesApiResponse = {
    timestamp: string;
    balances: {
        account: string; // Account ID in the format "0.0.x"
        balance: number; // Total balance equivalent in HBAR
        tokens: {
            token_id: string; // Token ID in the format "0.0.x"
            balance: number; // Balance of the specific token
        }[];
    }[];
    links: {
        next: string | null; // link to next page
    };
}

export type Airdrop = {
    amount: number;
    receiver_id: string;
    sender_id: string;
    token_id: string;
}

export type PendingAirdropsApiResponse = {
    airdrops: Airdrop[];
    links: {
        next: string | null;
    };
}

type Key = {
    _type: "ECDSA_SECP256K1" | "ED25519" | "ProtobufEncoded";
    key: string;
};

type TimestampRange = {
    from: string; // Unix timestamp in seconds.nanoseconds format
    to?: string | null; // Nullable Unix timestamp
};

export type TopicInfoApiResponse = {
    admin_key?: Key | null;
    auto_renew_account?: string | null; // Format: shard.realm.num (e.g., "0.0.2")
    auto_renew_period?: number | null; // 64-bit integer
    created_timestamp?: string | null; // Unix timestamp (e.g., "1586567700.453054000")
    deleted?: boolean | null;
    memo?: string;
    submit_key?: Key | null;
    timestamp?: TimestampRange;
    topic_id?: string | null; // Format: shard.realm.num (e.g., "0.0.2")
};

export type HCSMessage = {
    chunk_info: null | any;
    consensus_timestamp: string;
    message: string;
    payer_account_id: string;
    running_hash: string;
    running_hash_version: number;
    sequence_number: number;
    topic_id: string;
};

export type HCSMessageApiResponse = {
    messages: HCSMessage[];
    links: {
        next: string | null;
    };
};

export interface CreateNFTOptions extends Omit<CreateTokenOptions, "tokenType" | "client" | "decimals" | "initialSupply">{

}

export interface CreateFTOptions extends Omit<CreateTokenOptions, "tokenType" | "client"> {
}


export enum AgentKitActionName {
    CREATE_TOPIC_CUSTODIAL = 'createTopicCustodial',
    CREATE_TOPIC_NON_CUSTODIAL = 'createTopicNonCustodial',
    DELETE_TOPIC_CUSTODIAL = 'deleteTopicCustodial',
    DELETE_TOPIC_NON_CUSTODIAL = 'deleteTopicNonCustodial',
    SUBMIT_TOPIC_MESSAGE_CUSTODIAL = 'submitTopicMessageCustodial',
    SUBMIT_TOPIC_MESSAGE_NON_CUSTODIAL = 'submitTopicMessageCustodial',
    CREATE_TOKEN_CUSTODIAL = 'createTokenCustodial',
    CREATE_TOKEN_NON_CUSTODIAL = 'createTokenNonCustodial',
    ASSOCIATE_TOKEN_CUSTODIAL = 'associateTokenCustodial',
    ASSOCIATE_TOKEN_NON_CUSTODIAL = 'associateTokenNonCustodial',
    DISSOCIATE_TOKEN_CUSTODIAL = 'dissociateTokenCustodial',
    DISSOCIATE_TOKEN_NON_CUSTODIAL = 'dissociateTokenNonCustodial',
    AIRDROP_TOKEN_CUSTODIAL = 'airdropTokenCustodial',
    AIRDROP_TOKEN_NON_CUSTODIAL = 'airdropTokenNonCustodial',
    REJECT_TOKEN_CUSTODIAL = 'rejectedTokenCustodial',
    REJECT_TOKEN_NON_CUSTODIAL = 'rejectedTokenNonCustodial',
    MINT_TOKEN_CUSTODIAL = 'mintTokenCustodial',
    MINT_TOKEN_NON_CUSTODIAL = 'mintTokenNonCustodial',
    MINT_NFT_TOKEN_CUSTODIAL = 'mintNFTTokenCustodial',
    MINT_NFT_TOKEN_NON_CUSTODIAL = 'mintNFTTokenNonCustodial',
    CLAIM_AIRDROP_CUSTODIAL = 'claimAirdropCustodial',
    CLAIM_AIRDROP_NON_CUSTODIAL = 'claimAirdropNonCustodial',
    TRANSFER_TOKEN_CUSTODIAL = 'transferTokenCustodial',
    TRANSFER_TOKEN_NON_CUSTODIAL = 'transferTokenNonCustodial',
    TRANSFER_HBAR_CUSTODIAL = 'transferHbarCustodial',
    TRANSFER_HBAR_NON_CUSTODIAL = 'transferHbarNonCustodial',
    ASSET_ALLOWANCE_CUSTODIAL = 'assetAllowedCustodial',
    ASSET_ALLOWANCE_NON_CUSTODIAL = 'assetAllowedNonCustodial',
    GET_SAUCESWAP_POOL_RATES_CUSTODIAL = 'getSauceSwapPoolRatesCustodial',
    GET_SAUCESWAP_POOL_RATES_NON_CUSTODIAL = 'getSauceSwapPoolRatesNonCustodial',
    GET_SAUCESWAP_POOLS_CUSTODIAL = 'getSauceSwapPoolsCustodial',
    GET_SAUCESWAP_POOLS_NON_CUSTODIAL = 'getSauceSwapPoolsNonCustodial',
}
