import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createExecutionState,
  transitionStatus,
  ExecutionStatus,
  recordToolCall,
  recordObservation,
  recordError,
} from "../src/state/state.js";

describe("Execution State Model", () => {
  describe("Initialization", () => {
    it("should initialize a valid state with correct default values", () => {
      const question = "How does BullMQ handle failed jobs?";
      const state = createExecutionState({ question, maxIterations: 5 });

      assert.ok(state.runId.startsWith("run_"));
      assert.strictEqual(state.question, question);
      assert.strictEqual(state.status, ExecutionStatus.RUNNING);
      assert.strictEqual(state.iteration, 0);
      assert.strictEqual(state.maxIterations, 5);
      assert.deepStrictEqual(state.messages, []);
      assert.deepStrictEqual(state.toolCalls, []);
      assert.deepStrictEqual(state.observations, []);
      assert.deepStrictEqual(state.evidence, []);
      assert.strictEqual(state.finalAnswer, null);
      assert.strictEqual(state.terminationReason, null);
      assert.deepStrictEqual(state.errors, []);
      assert.ok(state.startedAt);
      assert.strictEqual(state.completedAt, null);
    });

    it("should reject invalid question inputs", () => {
      assert.throws(
        () => createExecutionState({ question: "" }),
        /Question must be a non-empty string/
      );
      assert.throws(
        () => createExecutionState({ question: "   " }),
        /Question must be a non-empty string/
      );
      assert.throws(
        () => createExecutionState({ question: null }),
        /Question must be a non-empty string/
      );
    });

    it("should reject non-positive or non-integer maxIterations limits", () => {
      assert.throws(
        () => createExecutionState({ question: "Valid", maxIterations: 0 }),
        /maxIterations must be a positive integer/
      );
      assert.throws(
        () => createExecutionState({ question: "Valid", maxIterations: -1 }),
        /maxIterations must be a positive integer/
      );
      assert.throws(
        () => createExecutionState({ question: "Valid", maxIterations: 3.5 }),
        /maxIterations must be a positive integer/
      );
      assert.throws(
        () => createExecutionState({ question: "Valid", maxIterations: "5" }),
        /maxIterations must be a positive integer/
      );
    });
  });

  describe("Status Transitions", () => {
    it("should allow legal transitions from RUNNING to COMPLETED", () => {
      const state = createExecutionState({ question: "Valid" });
      transitionStatus(state, ExecutionStatus.COMPLETED, "Answer produced.");

      assert.strictEqual(state.status, ExecutionStatus.COMPLETED);
      assert.strictEqual(state.terminationReason, "Answer produced.");
      assert.ok(state.completedAt);
    });

    it("should allow legal transitions from RUNNING to MAX_ITERATIONS_REACHED", () => {
      const state = createExecutionState({ question: "Valid" });
      transitionStatus(state, ExecutionStatus.MAX_ITERATIONS_REACHED, "Hit limit.");

      assert.strictEqual(state.status, ExecutionStatus.MAX_ITERATIONS_REACHED);
      assert.strictEqual(state.terminationReason, "Hit limit.");
      assert.ok(state.completedAt);
    });

    it("should allow legal transitions from RUNNING to FAILED", () => {
      const state = createExecutionState({ question: "Valid" });
      transitionStatus(state, ExecutionStatus.FAILED, "Fatal API error.");

      assert.strictEqual(state.status, ExecutionStatus.FAILED);
      assert.strictEqual(state.terminationReason, "Fatal API error.");
      assert.ok(state.completedAt);
    });

    it("should prevent terminal states from transitioning back to RUNNING or any other state", () => {
      const state = createExecutionState({ question: "Valid" });
      transitionStatus(state, ExecutionStatus.COMPLETED, "Completed successfully");

      assert.throws(
        () => transitionStatus(state, ExecutionStatus.RUNNING),
        /Illegal transition: Cannot transition from terminal status/
      );

      assert.throws(
        () => transitionStatus(state, ExecutionStatus.FAILED),
        /Illegal transition: Cannot transition from terminal status/
      );
    });
  });

  describe("Recording Helpers", () => {
    it("should record structured tool calls and observations", () => {
      const state = createExecutionState({ question: "Valid" });

      recordToolCall(
        state,
        { id: "call_1", name: "readLocalDocument", args: { documentId: "bullmq" } },
        1
      );
      assert.strictEqual(state.toolCalls.length, 1);
      assert.strictEqual(state.toolCalls[0].toolCallId, "call_1");
      assert.strictEqual(state.toolCalls[0].name, "readLocalDocument");

      recordObservation(
        state,
        { toolCallId: "call_1", name: "readLocalDocument", output: "BullMQ content" },
        1
      );
      assert.strictEqual(state.observations.length, 1);
      assert.strictEqual(state.observations[0].toolCallId, "call_1");
      assert.strictEqual(state.observations[0].output, "BullMQ content");

      recordError(state, new Error("Temporary network glitch"), 1);
      assert.strictEqual(state.errors.length, 1);
      assert.strictEqual(state.errors[0].message, "Temporary network glitch");
    });
  });
});
