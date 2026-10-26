import crypto from "node:crypto";

/**
 * Enumeration of all valid execution statuses.
 */
export const ExecutionStatus = Object.freeze({
  RUNNING: "RUNNING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  MAX_ITERATIONS_REACHED: "MAX_ITERATIONS_REACHED",
});

/**
 * Directed state transition graph.
 * Terminal states (COMPLETED, FAILED, MAX_ITERATIONS_REACHED) have empty transition sets,
 * ensuring an execution cannot accidentally transition back to RUNNING or another state.
 */
const LEGAL_TRANSITIONS = Object.freeze({
  [ExecutionStatus.RUNNING]: new Set([
    ExecutionStatus.COMPLETED,
    ExecutionStatus.FAILED,
    ExecutionStatus.MAX_ITERATIONS_REACHED,
  ]),
  [ExecutionStatus.COMPLETED]: new Set(),
  [ExecutionStatus.FAILED]: new Set(),
  [ExecutionStatus.MAX_ITERATIONS_REACHED]: new Set(),
});

/**
 * Creates and validates an initial agent execution state object.
 * 
 * @param {Object} params
 * @param {string} params.question - The user research question
 * @param {number} [params.maxIterations=5] - Maximum permitted decision iterations
 * @returns {Object} Explicitly initialized state object
 */
export function createExecutionState({ question, maxIterations = 5 }) {
  if (typeof question !== "string" || question.trim().length === 0) {
    throw new TypeError("Question must be a non-empty string.");
  }

  if (!Number.isInteger(maxIterations) || maxIterations <= 0) {
    throw new TypeError("maxIterations must be a positive integer.");
  }

  const runId = `run_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

  return {
    runId,
    question: question.trim(),
    status: ExecutionStatus.RUNNING,
    iteration: 0,
    maxIterations,
    messages: [],
    toolCalls: [],
    observations: [],
    evidence: [],
    evaluation: {
      status: "NOT_EVALUATED",
      score: null,
      checks: [],
    },
    finalAnswer: null,
    terminationReason: null,
    errors: [],
    startedAt: new Date().toISOString(),
    completedAt: null,
  };
}

/**
 * Transitions the execution state to a new status with validation against legal transitions.
 * 
 * @param {Object} state - The mutable state object
 * @param {string} newStatus - Target status from ExecutionStatus
 * @param {string} [reason=null] - Reason for the transition
 * @returns {Object} The updated state object
 */
export function transitionStatus(state, newStatus, reason = null) {
  if (!state || typeof state !== "object") {
    throw new TypeError("Invalid state object provided.");
  }

  const allowed = LEGAL_TRANSITIONS[state.status];
  if (!allowed) {
    throw new Error(`Unknown current status: "${state.status}".`);
  }

  if (allowed.size === 0) {
    throw new Error(
      `Illegal transition: Cannot transition from terminal status "${state.status}" to "${newStatus}".`
    );
  }

  if (!allowed.has(newStatus)) {
    throw new Error(
      `Illegal transition: Cannot transition from "${state.status}" to "${newStatus}". Allowed: [${Array.from(allowed).join(", ")}].`
    );
  }

  state.status = newStatus;
  state.terminationReason = reason;
  state.completedAt = new Date().toISOString();

  return state;
}

/**
 * Records a tool call in the state's structured toolCalls log.
 * 
 * @param {Object} state - Current execution state
 * @param {Object} toolCall - LangChain tool call { id, name, args }
 * @param {number} iteration - The current iteration index
 */
export function recordToolCall(state, toolCall, iteration) {
  state.toolCalls.push({
    toolCallId: toolCall.id,
    name: toolCall.name,
    args: toolCall.args,
    iteration,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Records a tool observation in the state's structured observations log.
 * 
 * @param {Object} state - Current execution state
 * @param {Object} observationData - { toolCallId, name, output }
 * @param {number} iteration - The current iteration index
 */
export function recordObservation(state, { toolCallId, name, output }, iteration) {
  state.observations.push({
    toolCallId,
    name,
    output,
    iteration,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Records an error in the state's structured error log.
 * 
 * @param {Object} state - Current execution state
 * @param {Error|string} error - The caught error
 * @param {number} [iteration=null] - The iteration index when error occurred
 */
export function recordError(state, error, iteration = null) {
  state.errors.push({
    message: typeof error === "string" ? error : error.message,
    stack: error.stack || null,
    iteration: iteration ?? state.iteration,
    timestamp: new Date().toISOString(),
  });
}

export default {
  ExecutionStatus,
  createExecutionState,
  transitionStatus,
  recordToolCall,
  recordObservation,
  recordError,
};
