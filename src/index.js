import "./config.js";
import { runAgent } from "./agent/agentLoop.js";

/**
 * Default research question from Agent_1st milestone benchmark.
 */
const DEFAULT_QUESTION = "How does BullMQ handle failed jobs?";

/**
 * Main application entrypoint for Atlas.
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Atlas — Local Research Agent

Usage:
  node src/index.js [question]

Options:
  --help, -h    Show this help message

Example:
  node src/index.js "How does BullMQ handle failed jobs?"
    `);
    process.exit(0);
  }

  // Use provided CLI question or fallback to benchmark question
  const question = args.length > 0 ? args.join(" ") : DEFAULT_QUESTION;

  try {
    const result = await runAgent(question);

    if (result.status === "COMPLETED") {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    console.error(`\n[FATAL ERROR]: Unexpected crash during agent execution:\n${error.stack || error.message}`);
    process.exit(1);
  }
}

main();
