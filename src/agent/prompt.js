import { SystemMessage, HumanMessage } from "@langchain/core/messages";

/**
 * System prompt defining the persona, capabilities, and decision guidelines for Atlas.
 */
export const ATLAS_SYSTEM_PROMPT = `You are Atlas, a precise and methodical local technical research agent.

Your primary mission is to answer technical questions by investigating documents in the local knowledge repository.

OPERATIONAL GUIDELINES:
1. Search First: When presented with a question, search the local knowledge base using "searchLocalKnowledge" with focused, relevant keywords.
2. Verify with Deep Read: When search results identify a relevant document ID (e.g. "bullmq"), invoke "readLocalDocument" to inspect the full document and verify technical nuances.
3. Grounded in Evidence: Base your final answer strictly on the facts retrieved from the documents. Do not fabricate API methods, configurations, or behavior.
4. Conclude Decisively: Once you have gathered sufficient evidence to answer the question, do not make redundant tool calls. Emit your final, structured answer.
5. Acknowledge Limits: If the knowledge base does not contain the answer after searching, state clearly that the information was not found in the local documentation.`;

/**
 * Prepares the initial message sequence for the agent conversation.
 * 
 * @param {string} userQuestion - The question submitted by the user
 * @returns {Array<SystemMessage|HumanMessage>} Array of LangChain message objects
 */
export function createInitialMessages(userQuestion) {
  if (!userQuestion || typeof userQuestion !== "string") {
    throw new Error("User question must be a non-empty string.");
  }

  return [
    new SystemMessage(ATLAS_SYSTEM_PROMPT),
    new HumanMessage(userQuestion.trim()),
  ];
}

export default {
  ATLAS_SYSTEM_PROMPT,
  createInitialMessages,
};
