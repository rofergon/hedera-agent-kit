// hedera-agent.ts

// Load environment variables
import * as dotenv from "dotenv";
dotenv.config();

// Import dependencies
import HederaAgentKit from './src/agent';
import { createHederaTools } from './src/langchain';
import { PrivateKey } from '@hashgraph/sdk';
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { createInterface } from 'readline';
import { RunnableConfig } from "@langchain/core/runnables";

// Check for required environment variables
if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

if (!process.env.HEDERA_ACCOUNT_ID || !process.env.HEDERA_PRIVATE_KEY || !process.env.HEDERA_NETWORK) {
  throw new Error("HEDERA_ACCOUNT_ID, HEDERA_PRIVATE_KEY and HEDERA_NETWORK environment variables are required");
}

console.log("Initializing Hedera Agent...");

// Get the public key from the private key
const privateKeyObject = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY);
const publicKeyDer = privateKeyObject.publicKey.toStringDer();

// Create Hedera agent instance
const hederaAgent = new HederaAgentKit(
  process.env.HEDERA_ACCOUNT_ID,
  process.env.HEDERA_PRIVATE_KEY,
  publicKeyDer,
  process.env.HEDERA_NETWORK as 'mainnet' | 'testnet' | 'previewnet'
);

// Get Hedera tools
console.log("Calling createHederaTools...");
const hederaTools = createHederaTools(hederaAgent);

// Debug: List all available tools with their names
console.log("Available tools:");
hederaTools.forEach(tool => {
  console.log(`- ${tool.name}`);
});

// Create custom tool node that forces custodial mode through config
class CustomToolNode extends ToolNode {
  override async invoke(state: { messages: any[] }, config?: RunnableConfig) {
    // Get the last message which contains the tool call
    const lastMessage = state.messages[state.messages.length - 1];
    
    // Create a new configuration object with custodial mode set to true
    const newConfig: RunnableConfig = {
      ...config,
      configurable: {
        ...config?.configurable,
        isCustodial: true
      }
    };
    
    if (lastMessage.additional_kwargs?.tool_calls) {
      const toolCalls = lastMessage.additional_kwargs.tool_calls;
      
      for (let i = 0; i < toolCalls.length; i++) {
        const toolCall = toolCalls[i];
        if (toolCall.function) {
          console.log(`Setting up custodial mode for tool call: ${toolCall.function.name}`);
          console.log(`Tool arguments: ${toolCall.function.arguments}`);
        }
      }
    }
    
    try {
      // Call the original invoke method with the new config
      const result = await super.invoke(state, newConfig);
      console.log("Tool execution result:", JSON.stringify(result));
      return result;
    } catch (error: any) {
      console.error("Error executing tool:", error);
      // Return an error message that can be shown to the user
      return {
        messages: [
          {
            content: `Error: Could not execute the requested tool. ${error.message || 'Unknown error'}`,
            tool_call_id: lastMessage.additional_kwargs?.tool_calls?.[0]?.id
          }
        ]
      };
    }
  }
}

// Create a tool node with Hedera tools
const toolNode = new CustomToolNode(hederaTools);

// Create system message with instructions for the agent
const systemMessage = new SystemMessage(
  `You are a helpful assistant specialized in Hedera blockchain operations.
You have access to the following Hedera tools:
- HBAR tools: Check balance, transfer HBAR
- HTS (Hedera Token Service) tools: Create tokens, check balances, transfer tokens, etc.
- HCS (Hedera Consensus Service) tools: Create topics, submit messages, get info, etc.
- SaucerSwap tools: 
  - Get pool conversion rates using the sauceswap_get_pool_conversion_rate tool
  - Get all available pools using the sauceswap_get_pools tool (supports pagination)

IMPORTANT: For transactions that modify state (transfers, token creation, etc.):
1. BEFORE executing any transaction, clearly explain what the transaction will do and ask the user for confirmation.
2. Only proceed with the transaction if the user explicitly approves.
3. For token operations, always provide details about the token created, transferred, or modified.
4. After a transaction is executed, always provide the transaction ID and status.

For SaucerSwap queries:
- To get pool conversion rates, use the sauceswap_get_pool_conversion_rate tool with a poolId parameter
- To get all available pools, use the sauceswap_get_pools tool with pagination to avoid token limitations:
  - Use page and pageSize parameters to control how many results you get (e.g., page=1, pageSize=5)
  - Use filter parameter to filter pools by token symbol (e.g., filter="HBAR" for HBAR pools only)
  - IMPORTANT: When showing pool results, ALWAYS include the pagination information:
    - Tell the user which page they're viewing and the total number of pages
    - Specify how many total pools exist and how many are being shown
    - If more pages exist, explicitly tell the user how to request the next page
    - Use the pagination.paginationSummary and pagination.navigationGuide fields from the response
  - Example response format: "Showing pools 1-5 of 50 total pools (page 1 of 10). There are 9 more pages available. To see more pools, request page 2."

For general questions about Hedera, provide helpful information.
Keep your responses concise and focused on completing the requested task.
Current Hedera network: ${process.env.HEDERA_NETWORK}
Account ID: ${process.env.HEDERA_ACCOUNT_ID}`
);

// Create a model and give it access to the tools
const model = new ChatOpenAI({
  modelName: "o4-mini", // You can change this to a different model
  temperature: 1,
}).bindTools(hederaTools);

// Define the function that determines whether to continue or not
function shouldContinue({ messages }: typeof MessagesAnnotation.State) {
  const lastMessage = messages[messages.length - 1];

  // If the LLM makes a tool call, then we route to the "tools" node
  if (lastMessage.additional_kwargs?.tool_calls) {
    return "tools";
  }
  // Otherwise, we stop (reply to the user) using the special "__end__" node
  return "__end__";
}

// Define the function that calls the model
async function callModel(state: typeof MessagesAnnotation.State) {
  const response = await model.invoke(state.messages);

  // We return a list, because this will get added to the existing list
  return { messages: [response] };
}

// Define a new graph
const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addEdge("__start__", "agent") // __start__ is a special name for the entrypoint
  .addNode("tools", toolNode)
  .addEdge("tools", "agent")
  .addConditionalEdges("agent", shouldContinue);

// Compile the workflow into a runnable
const agent = workflow.compile();

// Create a readline interface for terminal chat
const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("Hedera Agent initialized!");
console.log("====================================================");
console.log("Welcome to the Hedera LangGraph Agent!");
console.log("You can ask questions about your Hedera account,");
console.log("create tokens, transfer HBAR, and much more.");
console.log("Type 'exit' to quit the application.");
console.log("====================================================");

// Initialize conversation with system message
let conversationState = {
  messages: [systemMessage]
};

// Start the chat loop
async function chat() {
  rl.question("You: ", async (input) => {
    if (input.toLowerCase() === 'exit') {
      console.log("Goodbye!");
      rl.close();
      return;
    }

    try {
      // Create a new human message
      const humanMessage = new HumanMessage(input);
      
      // Add the human message to conversation history and invoke agent
      conversationState = await agent.invoke({
        messages: [...conversationState.messages, humanMessage]
      });

      // Get the last message from the agent
      const lastMessage = conversationState.messages[conversationState.messages.length - 1];
      console.log("Agent:", lastMessage.content);
    } catch (error) {
      console.error("Error:", error);
      console.log("Agent: I encountered an error while processing your request. Please try again.");
    }

    // Continue the chat loop
    chat();
  });
}

// Start the chat
chat(); 