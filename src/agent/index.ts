import {
    AccountId,
    Client,
    PendingAirdropId,
    PublicKey,
    TokenId,
    TokenType,
    TopicId,
    PrivateKey
} from "@hashgraph/sdk";
import {
    Airdrop,
    CreateFTOptions,
    CreateNFTOptions,
    HCSMessage,
    HederaNetworkType,
    HtsTokenDetails,
    SaucerSwapPoolConversionRate,
    TokenBalance,
    TopicInfoApiResponse,
    SaucerSwapPool,
} from "../types";
import { HcsTransactionBuilder } from "../tools/transactions/builders";
import { HtsTransactionBuilder } from "../tools/transactions/builders";
import { HbarTransactionBuilder } from "../tools/transactions/builders";
import {
    CustodialDissociateTokenResult,
    get_all_tokens_balances,
    get_hbar_balance,
    get_hts_balance,
    get_hts_token_details,
    get_pending_airdrops,
    get_token_holders,
    get_topic_info,
    get_topic_messages, NonCustodialDissociateTokenResult,
} from "../tools";
import { AccountTransactionBuilder } from "../tools/transactions/builders";
import { AirdropRecipient } from "../tools/transactions/strategies";
import {
    CreateTopicResult,
    CustodialCreateTopicResult,
    NonCustodialCreateTopicResult
} from "../tools";
import { BaseResult} from "../tools";
import {
    CustodialSubmitMessageResult,
    NonCustodialSubmitMessageResult,
    SubmitMessageResult
} from "../tools";
import {
    CustodialTransferHbarResult,
    NonCustodialTransferHbarResult,
    TransferHBARResult
} from "../tools";
import {
    CreateTokenResult,
    CustodialCreateTokenResult,
    NonCustodialCreateTokenResult
} from "../tools";
import {
    CustodialTransferTokenResult,
    NonCustodialTransferTokenResult,
    TransferTokenResult
} from "../tools";
import {
    AssociateTokenResult,
    CustodialAssociateTokenResult,
    NonCustodialAssociateTokenResult
} from "../tools";
import {
    AirdropResult,
    CustodialAirdropTokenResult,
    NonCustodialAirdropTokenResult
} from "../tools";
import { DissociateTokenResult } from "../tools";
import {
    CustodialRejectTokenResult,
    NonCustodialRejectTokenResult,
    RejectTokenResult
} from "../tools";
import {
    CustodialMintTokenResult,
    MintTokenResult,
    NonCustodialMintTokenResult
} from "../tools";
import { CustodialMintNFTResult, NonCustodialMintNFTResult } from "../tools";
import { ClaimAirdropResult, CustodialClaimAirdropResult, NonCustodialClaimAirdropResult } from "../tools";
import {
    CustodialDeleteTopicResult,
    DeleteTopicResult,
    NonCustodialDeleteTopicResult
} from "../tools";
import {
    AssetAllowanceResult,
    CustodialAssetAllowanceResult,
    NonCustodialAssetAllowanceResult
} from "../tools";

export class HederaAgentKit {
    public client: Client
    readonly network: 'mainnet' | 'testnet' | 'previewnet' = 'mainnet'
    readonly publicKey: PublicKey | undefined;
    private readonly privateKey: string | undefined;
    readonly accountId: string;
    private readonly isCustodial: boolean;

    constructor(
        accountId: string,
        privateKey?: string,
        publicKey?: string | undefined,
        network: 'mainnet' | 'testnet' | 'previewnet' = 'mainnet',
    ) {
        if(privateKey){
            // @ts-ignore
            this.client = Client.forNetwork(network).setOperator(accountId, privateKey);
            this.privateKey = privateKey;
            this.isCustodial = true;
        } else {
            // @ts-ignore
            this.client = Client.forNetwork(network);
            if(!publicKey) {
                throw new Error("Public key is missing. To perform non custodial action you should pass public key!");
            }
            this.isCustodial = false;
        }
        this.publicKey = PublicKey.fromString(publicKey!);
        this.network = network;
        this.accountId = accountId;
    }

    private isClient(x: any): x is Client {
        return typeof x.setOperator === 'function';
    }

    async createTopic(
        topicMemo: string,
        isSubmitKey: boolean,
        custodial?: boolean,
    ): Promise<BaseResult<string> | BaseResult<CreateTopicResult>> {
        const useCustodial = custodial ?? this.isCustodial;

        if (useCustodial) {
            if (!this.privateKey) {
                throw new Error("Private key is missing. To perform custodial action you should pass private key!");
            }
            return this.createTopicCustodial(topicMemo, isSubmitKey);
        }

        return this.createTopicNonCustodial(topicMemo, isSubmitKey);
    }

    private async createTopicCustodial(
        topicMemo: string,
        isSubmitKey: boolean,
    ) : Promise<CustodialCreateTopicResult> {
        if(!this.privateKey) throw new Error("Custodial actions require privateKey!");

        const response: CreateTopicResult =  await HcsTransactionBuilder
            .createTopic(topicMemo, this.client.operatorPublicKey, isSubmitKey)
            .signAndExecute(this.client);

        return new CustodialCreateTopicResult(response.topicId, response.txHash, response.status)
    }

    private async createTopicNonCustodial(
        topicMemo: string,
        isSubmitKey: boolean,
    ) : Promise<NonCustodialCreateTopicResult> {
        const txBytes =  await HcsTransactionBuilder
            .createTopic(topicMemo, this.client.operatorPublicKey, isSubmitKey)
            .getTxBytesString(this.client, this.accountId);

        return new NonCustodialCreateTopicResult(txBytes);
    }


    async submitTopicMessage(
        topicId: TopicId,
        message: string,
        custodial?: boolean,
    ): Promise<BaseResult<string> | BaseResult<SubmitMessageResult>> {
        const useCustodial = custodial ?? this.isCustodial;

        if (useCustodial) {
            if (!this.privateKey) {
                throw new Error("Private key is missing. To perform custodial action you should pass private key!");
            }
            return this.submitTopicMessageCustodial(topicId, message);
        }

        return this.submitTopicMessageNonCustodial(topicId, message);
    }

    private async submitTopicMessageCustodial(
        topicId: TopicId,
        message: string,
    ): Promise<CustodialSubmitMessageResult> {
        if(!this.privateKey) throw new Error("Custodial actions require privateKey!");

        const response: SubmitMessageResult =  await HcsTransactionBuilder
            .submitTopicMessage(topicId, message)
            .signAndExecute(this.client);

        return new CustodialSubmitMessageResult(response.txHash, response.status, response.topicId);
    }

    private async submitTopicMessageNonCustodial(
        topicId: TopicId,
        message: string,
    ): Promise<NonCustodialSubmitMessageResult> {

        const txBytes = await HcsTransactionBuilder
            .submitTopicMessage(topicId, message)
            .getTxBytesString(this.client, this.accountId);

        return new NonCustodialSubmitMessageResult(txBytes);
    }

    async transferHbar(
        toAccountId: string | AccountId,
        amount: string,
        custodial?: boolean,
    ): Promise<BaseResult<string> | BaseResult<TransferHBARResult>> {
        const useCustodial = custodial ?? this.isCustodial;

        if (useCustodial) {
            if (!this.privateKey) {
                throw new Error("Private key is missing. To perform custodial action you should pass private key!");
            }
            return this.transferHbarCustodial(toAccountId, amount);
        }

        return this.transferHbarNonCustodial(toAccountId, amount);
    }

    private async transferHbarCustodial(
        toAccountId: string | AccountId,
        amount: string
    ): Promise<CustodialTransferHbarResult> {
        if(!this.privateKey) throw new Error("Custodial actions require privateKey!");

        const response = await HbarTransactionBuilder
            .transferHbar(this.client.operatorAccountId!, toAccountId, amount)
            .signAndExecute(this.client);

        return new CustodialTransferHbarResult(response.txHash, response.status);
    }

    private async transferHbarNonCustodial(
        toAccountId: string | AccountId,
        amount: string
    ): Promise<NonCustodialTransferHbarResult> {

        const txBytes = await HbarTransactionBuilder
            .transferHbar(this.accountId, toAccountId, amount)
            .getTxBytesString(this.client, this.accountId);

        return new NonCustodialTransferHbarResult(txBytes);
    }


    async createFT(
        options: CreateFTOptions,
        custodial?: boolean
    ): Promise<BaseResult<string> | BaseResult<CreateTokenResult>> {
        const useCustodial = custodial ?? this.isCustodial;

        if (useCustodial) {
            if (!this.privateKey) {
                throw new Error("Private key is missing. To perform custodial action you should pass private key!");
            }
            return this.createFTCustodial(options);
        }

        return this.createFTNonCustodial(options);
    }

    private async createFTCustodial(options: CreateFTOptions): Promise<CustodialCreateTokenResult> {
        if(!this.privateKey) throw new Error("Custodial actions require privateKey!");
        const response: CreateTokenResult = await HtsTransactionBuilder.createToken(
            {
                ...options,
                tokenType: TokenType.FungibleCommon,
                client: this.client,
            },
            this.client.operatorPublicKey!,
            this.client.operatorAccountId!,
        ).signAndExecute(this.client);

        return new CustodialCreateTokenResult(response.txHash, response.status, response.tokenId);
    }

    private async createFTNonCustodial(options: CreateFTOptions): Promise<NonCustodialCreateTokenResult> {
        const txBytes = await HtsTransactionBuilder.createToken(
            {
                ...options,
                tokenType: TokenType.FungibleCommon,
                client: this.client,
            },
            this.publicKey!,
            this.accountId,
        ).getTxBytesString(this.client, this.accountId);

        return new NonCustodialCreateTokenResult(txBytes);
    }


    async createNFT(
        options: CreateNFTOptions,
        custodial?: boolean
    ): Promise<BaseResult<string> | BaseResult<CreateTokenResult>> {
        const useCustodial = custodial ?? this.isCustodial;

        if (useCustodial) {
            if (!this.privateKey) {
                throw new Error("Private key is missing. To perform custodial action you should pass private key!");
            }
            return this.createNFTCustodial(options);
        }

        return this.createNFTNonCustodial(options);
    }

    private async createNFTCustodial(options: CreateNFTOptions): Promise<CustodialCreateTokenResult> {
        if(!this.privateKey) throw new Error("Custodial actions require privateKey!");
        const response: CreateTokenResult = await HtsTransactionBuilder.createToken(
            {
                ...options,
                decimals: 0,
                initialSupply: 0,
                isSupplyKey: true,
                tokenType: TokenType.NonFungibleUnique,
                client: this.client,
            },
            this.client.operatorPublicKey!,
            this.client.operatorAccountId!,
        ).signAndExecute(this.client);

        return new CustodialCreateTokenResult(response.txHash, response.status, response.tokenId);
    }

    private async createNFTNonCustodial(options: CreateNFTOptions): Promise<NonCustodialCreateTokenResult> {
        const txBytes = await HtsTransactionBuilder.createToken(
            {
                ...options,
                decimals: 0,
                initialSupply: 0,
                isSupplyKey: true,
                tokenType: TokenType.NonFungibleUnique,
                client: this.client,
            },
            this.publicKey!,
            this.accountId,
        ).getTxBytesString(this.client, this.accountId);

        return new NonCustodialCreateTokenResult(txBytes);
    }


    async transferToken(
        tokenId: TokenId,
        toAccountId: string | AccountId,
        amount: number,
        custodial?: boolean
    ): Promise<BaseResult<string> | BaseResult<TransferTokenResult>> {
        const useCustodial = custodial ?? this.isCustodial;

        if (useCustodial) {
            if (!this.privateKey) {
                throw new Error("Private key is missing. To perform custodial action you should pass private key!");
            }
            return this.transferTokenCustodial(tokenId, toAccountId, amount);
        }

        return this.transferTokenNonCustodial(tokenId, toAccountId, amount);
    }

    private async transferTokenCustodial(
        tokenId: TokenId,
        toAccountId: string | AccountId,
        amount: number
    ): Promise<CustodialTransferTokenResult> {
        const response: TransferTokenResult = await HtsTransactionBuilder.transferToken(
            tokenId,
            amount,
            toAccountId,
            this.accountId
        ).signAndExecute(this.client);

        return new CustodialTransferTokenResult(response.txHash, response.status);
    }

    private async transferTokenNonCustodial(
        tokenId: TokenId,
        toAccountId: string | AccountId,
        amount: number
    ): Promise<NonCustodialTransferTokenResult> {
        const txBytes = await HtsTransactionBuilder.transferToken(
            tokenId,
            amount,
            toAccountId,
            this.accountId
        ).getTxBytesString(this.client, this.accountId);

        return new NonCustodialTransferTokenResult(txBytes);
    }


    async getHbarBalance(accountId?: string): Promise<number> {
        const targetAccountId = accountId || this.client.operatorAccountId;
        return get_hbar_balance(this.client, targetAccountId);
    }


    async getHtsBalance(
        tokenId: string,
        networkType: HederaNetworkType,
        accountId?: string
    ): Promise<number> {
        const targetAccountId = accountId || this.client.operatorAccountId;
        return get_hts_balance(tokenId, networkType, targetAccountId as string);
    }


    async getAllTokensBalances(
        networkType: HederaNetworkType,
        accountId?: string
    ) {
        const targetAccountId = accountId || this.client.operatorAccountId;
        return get_all_tokens_balances(networkType, targetAccountId as string);
    }


    async getHtsTokenDetails(
        tokenId: string,
        networkType: HederaNetworkType
    ): Promise<HtsTokenDetails> {
        return get_hts_token_details(tokenId, networkType);
    }


    async getTokenHolders(
        tokenId: string | TokenId,
        networkType: HederaNetworkType,
        threshold?: number,
    ): Promise<Array<TokenBalance>> {
        return get_token_holders(tokenId.toString(), networkType, threshold);
    }


    async associateToken(
        tokenId: TokenId,
        custodial?: boolean
    ): Promise<BaseResult<string> | BaseResult<AssociateTokenResult>> {
        const useCustodial = custodial ?? this.isCustodial;

        if (useCustodial) {
            if (!this.privateKey) {
                throw new Error("Private key is missing. To perform custodial action you should pass private key!");
            }
            return this.associateTokenCustodial(tokenId);
        }

        return this.associateTokenNonCustodial(tokenId);
    }

    private async associateTokenCustodial(
        tokenId: TokenId
    ): Promise<CustodialAssociateTokenResult> {
        const response: AirdropResult = await HtsTransactionBuilder.associateToken(
            tokenId,
            this.accountId
        ).signAndExecute(this.client);

        return new CustodialAssociateTokenResult(response.txHash, response.status);
    }

    private async associateTokenNonCustodial(
        tokenId: TokenId
    ): Promise<NonCustodialAssociateTokenResult> {
        const txBytes = await HtsTransactionBuilder.associateToken(
            tokenId,
            this.accountId
        ).getTxBytesString(this.client, this.accountId);

        return new NonCustodialAssociateTokenResult(txBytes);
    }


    async dissociateToken(
        tokenId: TokenId,
        custodial?: boolean
    ): Promise<BaseResult<string> | BaseResult<DissociateTokenResult>> {
        const useCustodial = custodial ?? this.isCustodial;

        if (useCustodial) {
            if (!this.privateKey) {
                throw new Error("Private key is missing. To perform custodial action you should pass private key!");
            }
            return this.dissociateTokenCustodial(tokenId);
        }

        return this.dissociateTokenNonCustodial(tokenId);
    }

    private async dissociateTokenCustodial(
        tokenId: TokenId
    ): Promise<CustodialDissociateTokenResult> {
        const response: DissociateTokenResult = await HtsTransactionBuilder.dissociateToken(
            tokenId,
            this.accountId
        ).signAndExecute(this.client);

        return new CustodialDissociateTokenResult(response.txHash, response.status);
    }

    private async dissociateTokenNonCustodial(
        tokenId: TokenId
    ): Promise<NonCustodialDissociateTokenResult> {
        const txBytes = await HtsTransactionBuilder.dissociateToken(
            tokenId,
            this.accountId
        ).getTxBytesString(this.client, this.accountId);

        return new NonCustodialDissociateTokenResult(txBytes);
    }


    async airdropToken(
        tokenId: TokenId,
        recipients: AirdropRecipient[],
        custodial?: boolean,
    ): Promise<BaseResult<string> | BaseResult<AirdropResult>> {
        const useCustodial = custodial ?? this.isCustodial;

        if (useCustodial) {
            if (!this.privateKey) {
                throw new Error("Private key is missing. To perform custodial action you should pass private key!");
            }
            return this.airdropTokenCustodial(tokenId, recipients);
        }

        return this.airdropTokenNonCustodial(tokenId, recipients);
    }

    private async airdropTokenCustodial(
        tokenId: TokenId,
        recipients: AirdropRecipient[]
    ): Promise<CustodialAirdropTokenResult> {
        const response: AirdropResult = await HtsTransactionBuilder.airdropToken(
            tokenId,
            recipients,
            this.accountId
        ).signAndExecute(this.client);

        return new CustodialAirdropTokenResult(response.txHash, response.status);
    }

    private async airdropTokenNonCustodial(
        tokenId: TokenId,
        recipients: AirdropRecipient[]
    ): Promise<NonCustodialAirdropTokenResult> {
        const txBytes = await HtsTransactionBuilder.airdropToken(
            tokenId,
            recipients,
            this.accountId
        ).getTxBytesString(this.client, this.accountId);

        return new NonCustodialAirdropTokenResult(txBytes);
    }


    async rejectToken(
        tokenId: TokenId,
        custodial?: boolean,
    ): Promise<BaseResult<string> | BaseResult<RejectTokenResult>> {
        const useCustodial = custodial ?? this.isCustodial;

        if (useCustodial) {
            if (!this.privateKey) {
                throw new Error("Private key is missing. To perform custodial action you should pass private key!");
            }
            return this.rejectTokenCustodial(tokenId);
        }

        return this.rejectTokenNonCustodial(tokenId);
    }

    private async rejectTokenCustodial(
        tokenId: TokenId,
    ): Promise<CustodialRejectTokenResult> {
        const response: RejectTokenResult = await HtsTransactionBuilder.rejectToken(
            tokenId,
            AccountId.fromString(this.accountId)
        ).signAndExecute(this.client);

        return new CustodialRejectTokenResult(response.txHash, response.status);
    }

    private async rejectTokenNonCustodial(
        tokenId: TokenId,
    ): Promise<NonCustodialRejectTokenResult> {
        const txBytes = await HtsTransactionBuilder.rejectToken(
            tokenId,
            AccountId.fromString(this.accountId)
        ).getTxBytesString(this.client, this.accountId);

        return new NonCustodialRejectTokenResult(txBytes);
    }


    async mintToken(
        tokenId: TokenId,
        amount: number,
        custodial?: boolean,
    ): Promise<BaseResult<string> | BaseResult<MintTokenResult>> {
        const useCustodial = custodial ?? this.isCustodial;

        if (useCustodial) {
            if (!this.privateKey) {
                throw new Error("Private key is missing. To perform custodial action you should pass private key!");
            }
            return this.mintTokenCustodial(tokenId, amount);
        }

        return this.mintTokenNonCustodial(tokenId, amount);
    }

    private async mintTokenCustodial(
        tokenId: TokenId,
        amount: number
    ): Promise<CustodialMintTokenResult> {
        const response: MintTokenResult = await HtsTransactionBuilder.mintToken(
            tokenId,
            amount,
        ).signAndExecute(this.client);

        return new CustodialMintTokenResult(response.txHash, response.status);
    }

    private async mintTokenNonCustodial(
        tokenId: TokenId,
        amount: number
    ): Promise<NonCustodialMintTokenResult> {
        const txBytes = await HtsTransactionBuilder.mintToken(
            tokenId,
            amount,
        ).getTxBytesString(this.client, this.accountId);

        return new NonCustodialMintTokenResult(txBytes);
    }


    async mintNFTToken(
        tokenId: TokenId,
        tokenMetadata: Uint8Array,
        custodial?: boolean,
    ): Promise<BaseResult<string> | BaseResult<MintTokenResult>> {
        const useCustodial = custodial ?? this.isCustodial;

        if (useCustodial) {
            if (!this.privateKey) {
                throw new Error("Private key is missing. To perform custodial action you should pass private key!");
            }
            return this.mintNFTTokenCustodial(tokenId, tokenMetadata);
        }

        return this.mintNFTTokenNonCustodial(tokenId, tokenMetadata);
    }

    private async mintNFTTokenCustodial(
        tokenId: TokenId,
        tokenMetadata: Uint8Array
    ): Promise<CustodialMintNFTResult> {
        const response: MintTokenResult = await HtsTransactionBuilder.mintNft(
            tokenId,
            tokenMetadata,
        ).signAndExecute(this.client);

        return new CustodialMintNFTResult(response.txHash, response.status);
    }

    private async mintNFTTokenNonCustodial(
        tokenId: TokenId,
        tokenMetadata: Uint8Array
    ): Promise<NonCustodialMintNFTResult> {
        const txBytes = await HtsTransactionBuilder.mintNft(
            tokenId,
            tokenMetadata,
        ).getTxBytesString(this.client, this.accountId);

        return new NonCustodialMintNFTResult(txBytes);
    }


    async claimAirdrop(
        airdropId: PendingAirdropId,
        custodial?: boolean,
    ): Promise<BaseResult<string> | BaseResult<ClaimAirdropResult>> {
        const useCustodial = custodial ?? this.isCustodial;

        if (useCustodial) {
            if (!this.privateKey) {
                throw new Error("Private key is missing. To perform custodial action you should pass private key!");
            }
            return this.claimAirdropCustodial(airdropId);
        }

        return this.claimAirdropNonCustodial(airdropId);
    }

    private async claimAirdropCustodial(
        airdropId: PendingAirdropId
    ): Promise<CustodialClaimAirdropResult> {
        const response: ClaimAirdropResult =  await HtsTransactionBuilder.claimAirdrop(
            airdropId
        ).signAndExecute(this.client);

        return new CustodialClaimAirdropResult(response.txHash, response.status);
    }

    private async claimAirdropNonCustodial(
        airdropId: PendingAirdropId
    ): Promise<NonCustodialClaimAirdropResult> {
        const txBytes = await HtsTransactionBuilder.claimAirdrop(
            airdropId
        ).getTxBytesString(this.client, this.accountId);

        return new NonCustodialClaimAirdropResult(txBytes);
    }


    async getPendingAirdrops(
        accountId: string,
        networkType: HederaNetworkType
    ): Promise<Airdrop[]> {
        return get_pending_airdrops(networkType, accountId)
    }


    async deleteTopic(
        topicId: TopicId,
        custodial?: boolean,
    ): Promise<BaseResult<string> | BaseResult<DeleteTopicResult>> {
        const useCustodial = custodial ?? this.isCustodial;

        if (useCustodial) {
            if (!this.privateKey) {
                throw new Error("Private key is missing. To perform custodial action you should pass private key!");
            }
            return this.deleteTopicCustodial(topicId);
        }

        return this.deleteTopicNonCustodial(topicId);
    }

    private async deleteTopicCustodial(
        topicId: TopicId
    ): Promise<CustodialDeleteTopicResult> {
        const response: DeleteTopicResult = await HcsTransactionBuilder.deleteTopic(
            topicId
        ).signAndExecute(this.client);

        return new CustodialDeleteTopicResult(response.txHash, response.status);
    }

    private async deleteTopicNonCustodial(
        topicId: TopicId
    ): Promise<NonCustodialDeleteTopicResult> {
        const txBytes =  await HcsTransactionBuilder.deleteTopic(
            topicId
        ).getTxBytesString(this.client, this.accountId);

        return new NonCustodialDeleteTopicResult(txBytes);
    }


    async getTopicInfo(
        topicId: TopicId,
        networkType: HederaNetworkType,
    ): Promise<TopicInfoApiResponse> {
        return get_topic_info(topicId, networkType)
    }


    async getTopicMessages(
        topicId: TopicId,
        networkType: HederaNetworkType,
        lowerTimestamp?: number,
        upperTimestamp?: number,
    ): Promise<Array<HCSMessage>> {
        return get_topic_messages(topicId, networkType, lowerTimestamp, upperTimestamp);
    }


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

    /**
     * Gets all available pools from SaucerSwap
     * @returns Array of SaucerSwap pool data
     */
    async getSauceSwapPools(): Promise<SaucerSwapPool[]> {
        const baseUrl = "https://api.saucerswap.finance";
        const endpoint = "/pools";
        
        const url = `${baseUrl}${endpoint}`;
        
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Error fetching pools: ${response.status} - ${response.statusText}`);
            }
            
            return await response.json() as SaucerSwapPool[];
        } catch (error: any) {
            throw new Error(`Failed to get SaucerSwap pools: ${error.message}`);
        }
    }

    async approveAssetAllowance(
        spenderAccount: AccountId | string,
        amount: number,
        tokenId?: TokenId,
        custodial?: boolean
    ): Promise<BaseResult<string> | BaseResult<AssetAllowanceResult>> {
        const useCustodial = custodial ?? this.isCustodial;

        if (useCustodial) {
            if (!this.privateKey) {
                throw new Error("Private key is missing. To perform custodial action you should pass private key!");
            }
            return this.approveAssetAllowanceCustodial(spenderAccount, amount, tokenId);
        }

        return this.approveAssetAllowanceNonCustodial(spenderAccount, amount, tokenId);
    }

    async approveAssetAllowanceCustodial(
        spenderAccount: AccountId | string,
        amount: number,
        tokenId?: TokenId,
    ): Promise<CustodialAssetAllowanceResult> {
        const response: AssetAllowanceResult = await AccountTransactionBuilder.approveAssetAllowance(
            spenderAccount,
            amount,
            this.accountId,
            tokenId
        ).signAndExecute(this.client);

        return new CustodialAssetAllowanceResult(response.txHash, response.status);
    }

    async approveAssetAllowanceNonCustodial(
        spenderAccount: AccountId | string,
        amount: number,
        tokenId?: TokenId,
    ): Promise<NonCustodialAssetAllowanceResult> {
        const txBytes = await AccountTransactionBuilder.approveAssetAllowance(
            spenderAccount,
            amount,
            this.accountId,
            tokenId
        ).getTxBytesString(this.client, this.accountId);

        return new NonCustodialAssetAllowanceResult(txBytes);
    }
}

export default HederaAgentKit;