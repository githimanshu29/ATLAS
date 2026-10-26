import { createInitialMessages } from "./prompt.js";
import { executeTool } from "./executeTool.js";
import { searchLocalKnowledgeTool } from "../tools/searchLocalKnowledge.js";
import { readLocalDocumentTool } from "../tools/readLocalDocument.js";
import { defaultModel } from "../model.js";

const DEFAULT_MAX_ITERATIONS = 5;

/**
 * Executes the foundational single-loop ReAct agent workflow for Atlas.
 * 
 * Exposes the complete decision loop from first principles:
 * 1. Initial Prompt & Question construction
 * 2. Model invocation with bound tool declarations
 * 3. Inspection of response (tool_calls vs final answer)
 * 4. Tool execution and ToolMessage observation appending
 * 5. Loop continuation and strict 5-iteration limit enforcement
 * 
 * @param {string} userQuestion - The technical question for Atlas to research
 * @param {Object} [options={}] - Configuration options
 * @param {number} [options.maxIterations=5] - Maximum reasoning-action iterations
 * @param {Object} [options.model=defaultModel] - Chat model instance
 * @returns {Promise<Object>} Execution result containing status, answer, and metrics
 */
export async function runAgent(userQuestion, options = {}) {
  const maxIterations = options.maxIterations || DEFAULT_MAX_ITERATIONS;
  const model = options.model || defaultModel;

  // Bind tools to the chat model so Gemini knows their signatures and schemas
  const modelWithTools = model.bindTools([
    searchLocalKnowledgeTool,
    readLocalDocumentTool,
  ]);

  console.log("========================================");
  console.log("ATLAS — LOCAL RESEARCH AGENT");
  console.log("========================================");
  console.log(`\nQuestion:\n${userQuestion.trim()}`);

  // 1. Initialize conversation history with SystemMessage + HumanMessage
  const messages = createInitialMessages(userQuestion);

  for (let iteration = 1; iteration <= maxIterations; iteration++) {
    if (iteration > 1) {
      console.log("\n----------------------------------------");
    }

    console.log(`\n[ITERATION ${iteration}]`);
    console.log("Calling model...");

    let response;
    try {
      // 2. Invoke model with full conversation history
      response = await modelWithTools.invoke(messages);
    } catch (error) {
      console.error(`\nAGENT STATUS:\nFAILED\n\nTERMINATION REASON:\nModel invocation error: ${error.message}`);
      return {
        status: "FAILED",
        error: error.message,
        iterations: iteration,
        messages,
      };
    }

    // 3. Append model's response (AIMessage) to preserve strict message ordering
    messages.push(response);

    // 4. Inspect response for tool calls
    const toolCalls = response.tool_calls || [];

    // Case A: Model produced final answer (no tool calls requested)
    if (toolCalls.length === 0) {
      console.log("\nLLM DECISION:\nNo more tool calls.");
      console.log("\nAGENT STATUS:\nCOMPLETED");
      console.log(`\nFINAL ANSWER:\n${response.content}`);

      return {
        status: "COMPLETED",
        answer: response.content,
        iterations: iteration,
        messages,
      };
    }

    // Case B: Model requested one or more tool executions
    for (const toolCall of toolCalls) {
      const toolMessage = await executeTool(toolCall);
      // 5. Append observation (ToolMessage) directly into conversation state
      messages.push(toolMessage);
    }

    // 6. Check if iteration limit is reached before model could finalize answer
    if (iteration === maxIterations) {
      console.log("\n----------------------------------------");
      console.log("\nAGENT STATUS:\nMAX_ITERATIONS_REACHED");
      console.log(
        `\nTERMINATION REASON:\nReached maximum limit of ${maxIterations} iterations without a concluding answer.`
      );

      return {
        status: "MAX_ITERATIONS_REACHED",
        answer: null,
        iterations: iteration,
        messages,
      };
    }
  }
}

export default runAgent;
