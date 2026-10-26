# BullMQ: Job Processing & Failure Handling

BullMQ is a NodeJS message queue and batch processing library based on Redis.

## Job Lifecycle
When a job is added to a queue, it progresses through states:
1. `wait`: Job is waiting to be processed by a worker.
2. `active`: Worker is actively processing the job.
3. `completed`: Job finished successfully.
4. `failed`: Job encountered an error and exhausted its retry attempts.
5. `delayed`: Job is waiting for a scheduled delay before running.

## Handling Failed Jobs

### 1. Automatic Retries and Exponential Backoff
When adding a job, you can configure automatic retry attempts and backoff strategies:

```javascript
await myQueue.add('transcode', { videoId: '123' }, {
  attempts: 3,
  backoff: {
    type: 'exponential', // or 'fixed'
    delay: 1000          // Initial delay in milliseconds
  }
});
```

- If the worker throws an error during execution, BullMQ increments the attempt counter.
- If attempts remain, the job transitions back to `delayed` or `wait` according to the backoff schedule.

### 2. Failure Events
Workers and QueueEvents emit events when failures occur:

```javascript
const worker = new Worker('transcode', async job => {
  if (networkDown) throw new Error('Network timeout');
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed with error: ${err.message}`);
});
```

### 3. Exhausted Retries & Dead Letter Queue (DLQ)
- Once all configured attempts are exhausted, the job moves permanently to the `failed` set in Redis.
- Jobs in the `failed` state are retained according to the queue's `removeOnFail` setting.
- Operators can inspect failed reasons via `job.failedReason` and manually retry using `await job.retry()`.
