import { ToolMessage } from "@langchain/core/messages";
import { executeSearchLocalKnowledge } from "../tools/searchLocalKnowledge.js";
import { executeReadLocalDocument } from "../tools/readLocalDocument.js";

/**
 * Registry of available pure execution functions.
 */
const TOOL_REGISTRY = {
  searchLocalKnowledge: {
    description: "Searching local Markdown files...",
    handler: async (args) => {
      if (!args || typeof args.query !== "string") {
        throw new Error("Invalid arguments: 'query' string is required.");
      }
      return await executeSearchLocalKnowledge(args.query);
    },
  },
  readLocalDocument: {
    description: "Reading local document...",
    handler: async (args) => {
      if (!args || typeof args.documentId !== "string") {
        throw new Error("Invalid arguments: 'documentId' string is required.");
      }
      return await executeReadLocalDocument(args.documentId);
    },
  },
};

/**
 * Dispatches and executes a single tool call requested by the model.
 * 
 * Guarantees:
 * 1. Explicit terminal logging matching Atlas visibility requirements.
 * 2. Strict validation of tool existence and argument structure.
 * 3. Graceful error handling (returns error as observation instead of crashing).
 * 4. Construction of a compliant LangChain ToolMessage bound to tool_call_id.
 * 
 * @param {Object} toolCall - LangChain tool call object: { name, args, id }
 * @returns {Promise<ToolMessage>} Compliant ToolMessage for the conversation state
 */
export async function executeTool(toolCall) {
  const { name, args, id: toolCallId } = toolCall;

  console.log(`\nLLM DECISION:\nUse ${name}`);
  console.log(`\nTOOL ARGUMENTS:\n${JSON.stringify(args, null, 2)}`);

  const toolConfig = TOOL_REGISTRY[name];

  // 1. Unknown tool handling
  if (!toolConfig) {
    const available = Object.keys(TOOL_REGISTRY).join(", ");
    const errorMsg = `Error: Unknown tool "${name}". Available tools are: [${available}].`;
    
    console.log(`\nTOOL EXECUTION:\nFailed — Tool not found`);
    console.log(`\nOBSERVATION:\n${errorMsg}`);

    return new ToolMessage({
      tool_call_id: toolCallId,
      name,
      content: errorMsg,
    });
  }

  // 2. Safe execution & argument validation
  console.log(`\nTOOL EXECUTION:\n${toolConfig.description}`);

  let observation = "";
  try {
    observation = await toolConfig.handler(args);
  } catch (err) {
    observation = `Tool Execution Failure: ${err.message}`;
  }

  // Format observation for clean terminal inspection
  const observationPreview = observation.length > 300 
    ? `${observation.slice(0, 300)}... [truncated ${observation.length} bytes]` 
    : observation;

  console.log(`\nOBSERVATION:\n${observationPreview}`);

  // 3. Construct compliant LangChain ToolMessage
  return new ToolMessage({
    tool_call_id: toolCallId,
    name,
    content: observation,
  });
}

export default executeTool;
