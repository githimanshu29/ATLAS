import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

/**
 * Validates and normalizes runtime configuration for the AI Agent system.
 */
function loadConfig() {
  const googleApiKey = process.env.GOOGLE_API_KEY;

  if (!googleApiKey || googleApiKey === "your_gemini_api_key_here") {
    console.warn(
      "\n⚠️  [CONFIG WARNING]: GOOGLE_API_KEY is missing or set to placeholder in .env." +
      "\n   Please set a valid Gemini API key in your .env file to run the agent.\n"
    );
  }

  return Object.freeze({
    gemini: {
      apiKey: googleApiKey || "",
      modelName: process.env.GEMINI_MODEL || "gemini-1.5-flash",
      temperature: 0,
      maxOutputTokens: 2048,
    },
    langsmith: {
      tracingEnabled: process.env.LANGCHAIN_TRACING_V2 === "true",
      endpoint: process.env.LANGCHAIN_ENDPOINT || "https://api.smith.langchain.com",
      apiKey: process.env.LANGCHAIN_API_KEY || "",
      projectName: process.env.LANGCHAIN_PROJECT || "llm-to-agents",
    },
  });
}

export const config = loadConfig();
export default config;
