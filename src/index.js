import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import "./config.js";
import { runAgent } from "./agent/agentLoop.js";

/**
 * Default research question from Agent_1st milestone benchmark.
 */
const DEFAULT_QUESTION = "How does BullMQ handle failed jobs?";

/**
 * Prompts the user interactively in the terminal for a research question.
 * Falls back to DEFAULT_QUESTION if the user presses Enter without typing.
 * 
 * @returns {Promise<string>} The resolved question string
 */
async function promptUserForQuestion() {
  const rl = readline.createInterface({ input, output });

  try {
    console.log("\n💬 No question provided via command line.");
    const userInput = await rl.question(
      `Enter your research question (press Enter for default: "${DEFAULT_QUESTION}"):\n> `
    );
    const trimmed = userInput.trim();
    return trimmed.length > 0 ? trimmed : DEFAULT_QUESTION;
  } finally {
    rl.close();
  }
}

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
  node src/index.js                (launches interactive prompt mode)

Options:
  --help, -h    Show this help message

Examples:
  node src/index.js
  node src/index.js "How does BullMQ handle failed jobs?"
    `);
    process.exit(0);
  }

  // 1. If question is provided as CLI argument, use it directly
  // 2. Otherwise, ask interactively with default fallback
  let question;
  if (args.length > 0) {
    question = args.join(" ");
  } else {
    question = await promptUserForQuestion();
  }

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
