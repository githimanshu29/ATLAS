import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

// Securely locate the designated knowledge directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KNOWLEDGE_DIR = path.resolve(__dirname, "../../knowledge");

/**
 * Splits document content into searchable paragraph blocks.
 * 
 * @param {string} content - Markdown file content
 * @returns {Array<string>} Array of paragraphs
 */
function extractPassages(content) {
  return content
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 20); // Filter out trivial headers or empty lines
}

/**
 * Pure JavaScript execution function to search local Markdown documents using keyword matching.
 * 
 * @param {string} query - Search query containing one or more keywords
 * @returns {Promise<string>} Summary of matching passages and document identifiers
 */
export async function executeSearchLocalKnowledge(query) {
  if (!query || typeof query !== "string" || !query.trim()) {
    return "Error: Search query must be a non-empty string.";
  }

  // Tokenize query into distinct search terms (lowercase, alphanumeric)
  const keywords = query
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 2);

  if (keywords.length === 0) {
    return "Error: Query does not contain valid search terms (words must be at least 3 characters).";
  }

  try {
    const files = await fs.readdir(KNOWLEDGE_DIR);
    const mdFiles = files.filter(file => file.endsWith(".md"));

    if (mdFiles.length === 0) {
      return "Notice: No documents found in knowledge base.";
    }

    const matches = [];

    for (const file of mdFiles) {
      const documentId = file.slice(0, -3); // Strip .md
      const filePath = path.join(KNOWLEDGE_DIR, file);
      const content = await fs.readFile(filePath, "utf-8");
      const passages = extractPassages(content);

      for (const passage of passages) {
        const lowerPassage = passage.toLowerCase();
        let matchScore = 0;

        for (const kw of keywords) {
          if (lowerPassage.includes(kw)) {
            matchScore += 1;
          }
        }

        if (matchScore > 0) {
          matches.push({
            documentId,
            score: matchScore,
            passage: passage.length > 400 ? `${passage.slice(0, 400)}...` : passage,
          });
        }
      }
    }

    if (matches.length === 0) {
      const available = mdFiles.map(f => f.slice(0, -3)).join(", ");
      return `No relevant passages found for "${query}". Available documents to explore: [${available}].`;
    }

    // Rank by keyword match frequency (highest score first)
    matches.sort((a, b) => b.score - a.score);

    // Limit to top 3 most relevant passages to keep LLM context clean
    const topMatches = matches.slice(0, 3);
    const formattedResults = topMatches.map((m, idx) => 
      `[Passage ${idx + 1} | Document ID: "${m.documentId}" | Match Score: ${m.score}]\n${m.passage}`
    ).join("\n\n---\n\n");

    return `Found ${topMatches.length} relevant passages:\n\n${formattedResults}`;
  } catch (error) {
    return `Execution Error: Failed to search local knowledge: ${error.message}`;
  }
}

/**
 * LangChain Tool wrapper with Zod schema for model binding.
 */
export const searchLocalKnowledgeTool = tool(
  async ({ query }) => {
    return await executeSearchLocalKnowledge(query);
  },
  {
    name: "searchLocalKnowledge",
    description: "Search Markdown documents in the local knowledge base using keyword matching. Returns relevant passages and their documentId.",
    schema: z.object({
      query: z
        .string()
        .describe("Keywords to search for in local documentation (e.g. 'BullMQ failed jobs retries')."),
    }),
  }
);

export default searchLocalKnowledgeTool;
