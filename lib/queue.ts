/**
 * Simple in-memory async job queue with retry support.
 * Compatible interface with BullMQ — can be upgraded later.
 */

interface JobResult { success: boolean; error?: string }

interface QueueJob {
  id: string;
  name: string;
  data: unknown;
  attempts: number;
  maxAttempts: number;
  fn: (data: unknown) => Promise<void>;
}

class AsyncQueue {
  private queue: QueueJob[] = [];
  private processing = false;
  private handlers = new Map<string, (data: unknown) => Promise<void>>();
  readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  process(jobName: string, handler: (data: unknown) => Promise<void>) {
    this.handlers.set(jobName, handler);
  }

  async add(jobName: string, data: unknown, opts?: { attempts?: number; delay?: number }): Promise<JobResult> {
    const handler = this.handlers.get(jobName);
    if (!handler) {
      console.warn(`[Queue:${this.name}] No handler for job: ${jobName}`);
      return { success: false, error: "No handler" };
    }

    const job: QueueJob = {
      id: Math.random().toString(36).slice(2),
      name: jobName,
      data,
      attempts: 0,
      maxAttempts: opts?.attempts ?? 3,
      fn: handler,
    };

    if (opts?.delay && opts.delay > 0) {
      setTimeout(() => this.enqueue(job), opts.delay);
    } else {
      this.enqueue(job);
    }
    return { success: true };
  }

  private enqueue(job: QueueJob) {
    this.queue.push(job);
    if (!this.processing) this.tick();
  }

  private async tick() {
    if (this.queue.length === 0) { this.processing = false; return; }
    this.processing = true;
    const job = this.queue.shift()!;
    try {
      await job.fn(job.data);
    } catch (err) {
      job.attempts++;
      if (job.attempts < job.maxAttempts) {
        const delay = Math.pow(2, job.attempts) * 1000;
        console.warn(`[Queue:${this.name}] Job "${job.name}" failed (attempt ${job.attempts}/${job.maxAttempts}), retry in ${delay}ms`);
        setTimeout(() => this.enqueue(job), delay);
      } else {
        console.error(`[Queue:${this.name}] Job "${job.name}" permanently failed after ${job.maxAttempts} attempts:`, err);
      }
    }
    setImmediate(() => this.tick());
  }
}

// Named queues
export const smsQueue = new AsyncQueue("sms");
export const notificationQueue = new AsyncQueue("notification");
export const reportQueue = new AsyncQueue("report");
export const cleanupQueue = new AsyncQueue("cleanup");

// SMS job handler (registered once)
smsQueue.process("send-sms", async (data) => {
  const { phone, message } = data as { phone: string; message: string };
  const sslWirelessUrl = process.env.SSL_WIRELESS_URL ?? "https://globalsmspro.com/api/v3/sms/send";
  const apiKey = process.env.SSL_WIRELESS_API_KEY ?? "";
  const senderId = process.env.SSL_WIRELESS_SENDER_ID ?? "BizilCore";

  if (!apiKey) { console.log(`[SMS] No API key — skipping SMS to ${phone}: ${message}`); return; }

  const res = await fetch(`${sslWirelessUrl}?api_key=${apiKey}&type=text&contacts=${phone}&senderid=${senderId}&msg=${encodeURIComponent(message)}`, { method: "GET" });
  if (!res.ok) throw new Error(`SMS failed: ${res.status}`);
});

export async function enqueueSms(phone: string, message: string) {
  return smsQueue.add("send-sms", { phone, message }, { attempts: 3 });
}
