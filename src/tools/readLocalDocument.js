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
 * Pure JavaScript execution function to safely read a document.
 * 
 * Enforces strict security:
 * 1. Sanitizes documentId to prevent path traversal (no '../' or absolute paths).
 * 2. Confirms resolved path remains strictly inside the permitted KNOWLEDGE_DIR.
 * 3. Returns actionable error messages so the agent can self-correct.
 * 
 * @param {string} documentId - Document identifier (e.g. "bullmq" or "bullmq.md")
 * @returns {Promise<string>} The document content or structured error
 */
export async function executeReadLocalDocument(documentId) {
  if (!documentId || typeof documentId !== "string") {
    return "Error: documentId must be a non-empty string.";
  }

  // Normalize: remove trailing .md if provided by model
  const rawId = documentId.trim();
  const cleanId = rawId.endsWith(".md") ? rawId.slice(0, -3) : rawId;

  // Security check 1: Reject suspicious characters (strict whitelist)
  if (!/^[a-zA-Z0-9_-]+$/.test(cleanId)) {
    return `Security Error: Invalid document identifier "${documentId}". Only alphanumeric characters, hyphens, and underscores are permitted.`;
  }

  const fileName = `${cleanId}.md`;
  const targetPath = path.resolve(KNOWLEDGE_DIR, fileName);

  // Security check 2: Prevent directory traversal outside KNOWLEDGE_DIR
  if (!targetPath.startsWith(KNOWLEDGE_DIR)) {
    return `Security Error: Access denied. Cannot access paths outside knowledge repository.`;
  }

  try {
    const content = await fs.readFile(targetPath, "utf-8");
    return content;
  } catch (error) {
    if (error.code === "ENOENT") {
      // List available documents to assist agent self-correction
      try {
        const files = await fs.readdir(KNOWLEDGE_DIR);
        const available = files
          .filter(f => f.endsWith(".md"))
          .map(f => f.slice(0, -3));
        return `Error: Document "${cleanId}" not found. Available documents in knowledge base: [${available.join(", ")}].`;
      } catch {
        return `Error: Document "${cleanId}" not found in knowledge repository.`;
      }
    }
    return `Execution Error: Failed to read document "${cleanId}": ${error.message}`;
  }
}

/**
 * LangChain Tool wrapper with Zod schema for model binding.
 */
export const readLocalDocumentTool = tool(
  async ({ documentId }) => {
    return await executeReadLocalDocument(documentId);
  },
  {
    name: "readLocalDocument",
    description: "Read the complete contents of a specific technical document from the local knowledge base using its documentId (e.g. 'bullmq').",
    schema: z.object({
      documentId: z
        .string()
        .describe("The identifier of the document to read, without path or extension (e.g. 'bullmq')."),
    }),
  }
);

export default readLocalDocumentTool;
