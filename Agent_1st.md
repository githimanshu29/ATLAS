# Project: Atlas — Local Research Agent

## My objective

I want to learn how a normal LLM application becomes an agent through actual implementation, not just by reading generated code.

Use JavaScript ES modules, LangChain JS, and a chat model that supports tool calling.

This is an educational project that will run locally on my computer.

Do not introduce LangGraph orchestration, multiple agents, vector databases, cloud databases, or production harness abstractions in this stage.

## Agent concept

Build Atlas, a local research agent that answers technical questions using a collection of Markdown documents.

The agent should be able to:

1. Receive a research question.
2. Decide whether it needs additional information.
3. Select an available tool.
4. Request the tool with structured arguments.
5. Execute the tool through JavaScript.
6. Observe the tool result.
7. Decide whether to call another tool or produce its final answer.
8. Return the answer to the user.

## Available tools

Implement exactly two tools initially.

### 1. searchLocalKnowledge

Search Markdown documents inside a dedicated local knowledge directory.

Use simple keyword matching for the initial implementation. Return relevant passages and their document identifiers.

### 2. readLocalDocument

Read a specific document from the permitted knowledge directory.

Validate the document identifier and prevent path traversal or access outside the designated directory.

Do not give the LLM direct filesystem access.

## Agent execution

Implement the execution loop manually using LangChain's model and tool-calling primitives.

Do not begin with a prebuilt agent abstraction that hides the execution loop.

Expose the following steps in the code:

- Model invocation.
- Model response inspection.
- Tool-call detection.
- Tool argument validation.
- Tool execution.
- Tool-result message construction.
- Appending observations to the conversation.
- The next model invocation.
- Final-answer detection.
- Iteration-limit enforcement.

Maintain the correct message ordering and tool-call identifiers required by LangChain.

Set a maximum of five model-decision iterations initially.

If the agent reaches the limit, terminate safely. Do not return an unfinished tool call as if it were a successful final answer.

Handle model failures, invalid tool arguments, unknown tool names, and tool execution failures explicitly.

## Learning requirements

I already understand the basic terminology of LLMs, tools, and agents. I want to understand the execution mechanics.

Work in small, reviewable steps.

For each step:

1. Explain the specific problem we are solving.
2. Explain the component and its responsibility.
3. Explain why it belongs in this location in the architecture.
4. Implement only that step.
5. Show me the relevant code changes.
6. Explain the execution flow using a concrete example.
7. Tell me how to run and test it.
8. Ask me to inspect or test the result before proceeding.

Do not create the entire project in one response.

Do not silently rewrite unrelated files.

Inspect the existing repository before making changes. If it is empty, propose the minimal structure and dependencies first.

Do not install dependencies, overwrite existing files, or change unrelated project configuration without explaining the change and obtaining my approval where needed.

## Terminal visibility

Log each iteration and distinguish between:

- Model invocation.
- Model response.
- Selected tool.
- Tool arguments.
- Tool execution.
- Tool observation.
- Final-answer decision.
- Termination reason.

Do not log API keys or other secrets.

## First milestone

For now, implement only the minimum necessary to demonstrate the first complete agent cycle:

User question → LLM → tool-call request → JavaScript tool execution → tool result → LLM → final answer.

Start by inspecting the repository and explaining the dependencies and minimal architecture.

Do not implement checkpointing, evaluation frameworks, advanced observability, multi-agent orchestration, or the complete execution harness yet. Those are later learning stages.

Do not claim a feature works unless you have run an appropriate test.




                 USER QUESTION
                       |
                       v
                +-------------+
                |     LLM     |
                | Decide next |
                |    action   |
                +-------------+
                       |
                       v
                +-------------+
                |  DECISION   |
                +-------------+
                  /         \
                 /           \
        Call a tool         Final answer
             |                   |
             v                   v
       Execute tool            Return
             |
             v
       Observe result
             |
             +--------------------+
                                  |
                                  v
                           Back to the LLM





                           atlas/
│
├── knowledge/
│   ├── redis.md
│   ├── bullmq.md
│   └── backend-failures.md
│
├── src/
│   ├── config/
│   │   └── model.js
│   │
│   ├── tools/
│   │   ├── searchLocalKnowledge.js
│   │   └── readLocalDocument.js
│   │
│   ├── agent/
│   │   ├── prompt.js
│   │   ├── agentLoop.js
│   │   └── executeTool.js
│   │
│   └── index.js
│
├── .env
├── .gitignore
└── package.json













========================================
ATLAS — LOCAL RESEARCH AGENT
========================================

Question:
How does BullMQ handle failed jobs?

[ITERATION 1]
Calling model...

LLM DECISION:
Use searchLocalKnowledge

TOOL ARGUMENTS:
{ query: "BullMQ failed jobs retries" }

TOOL EXECUTION:
Searching local Markdown files...

OBSERVATION:
Found 2 relevant passages.

----------------------------------------

[ITERATION 2]
Calling model...

LLM DECISION:
Use readLocalDocument

TOOL ARGUMENTS:
{ documentId: "bullmq" }

TOOL EXECUTION:
Reading local document...

OBSERVATION:
Document loaded successfully.

----------------------------------------

[ITERATION 3]
Calling model...

LLM DECISION:
No more tool calls.

AGENT STATUS:
COMPLETED

FINAL ANSWER:
...