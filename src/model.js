import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { config } from "./config.js";

/**
 * Factory function to initialize a Google Gemini chat model instance.
 * 
 * @param {Object} [overrides={}] - Optional parameter overrides (temperature, modelName, etc.)
 * @returns {ChatGoogleGenerativeAI} Configured Gemini chat model
 */
export function createModel(overrides = {}) {
  const modelConfig = {
    apiKey: config.gemini.apiKey,
    modelName: overrides.modelName || config.gemini.modelName,
    temperature: overrides.temperature !== undefined ? overrides.temperature : config.gemini.temperature,
    maxOutputTokens: overrides.maxOutputTokens || config.gemini.maxOutputTokens,
  };

  return new ChatGoogleGenerativeAI(modelConfig);
}

// Default pre-configured instance ready for immediate use
export const defaultModel = createModel();

export default defaultModel;
