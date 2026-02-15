type UploadOptions = {
  endpoint?: string;
  fieldName?: string;
  maxRetries?: number;
  signal?: AbortSignal;
};

type UploadQueueConfig = {
  concurrency: number;
  dedupeWindowMs: number;
};

class HttpError extends Error {
  status: number;
  payload?: any;
  retryAfterMs?: number;

  constructor(status: number, message: string, payload?: any, retryAfterMs?: number) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.payload = payload;
    this.retryAfterMs = retryAfterMs;
  }
}

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));

    let done = false;
    const cleanup = () => {
      if (signal) signal.removeEventListener("abort", onAbort);
    };

    const t = setTimeout(() => {
      if (done) return;
      done = true;
      cleanup();
      resolve();
    }, ms);

    const onAbort = () => {
      if (done) return;
      done = true;
      clearTimeout(t);
      cleanup();
      reject(new DOMException("Aborted", "AbortError"));
    };

    if (signal) signal.addEventListener("abort", onAbort);
  });
}

function fileKey(file: File) {
  return `${file.name}::${file.size}::${file.type}::${file.lastModified}`;
}

function resolveApiOrigin() {
  const envAny = (import.meta as any)?.env || {};
  const raw = String(envAny.VITE_API_URL || envAny.VITE_API_BASE_URL || "").trim();
  if (!raw) return "";
  return raw.replace(/\/+$/, "").replace(/\/api\/?$/, "");
}

function resolveEndpoint(endpoint?: string) {
  const ep = String(endpoint || "/api/upload/image");
  const origin = resolveApiOrigin();
  if (!origin) return ep;
  if (/^https?:\/\//i.test(ep)) return ep;
  if (ep.startsWith("/")) return `${origin}${ep}`;
  return ep;
}

async function uploadOnce(file: File, opts: UploadOptions): Promise<string> {
  const fd = new FormData();
  fd.append(opts.fieldName ?? "image", file);

  const res = await fetch(resolveEndpoint(opts.endpoint), {
    method: "POST",
    body: fd,
    signal: opts.signal,
  });

  if (!res.ok) {
    let retryAfterMs: number | undefined = undefined;
    const retryAfter = res.headers.get("Retry-After");
    if (retryAfter) {
      const seconds = Number(retryAfter);
      if (Number.isFinite(seconds)) {
        retryAfterMs = Math.max(0, Math.floor(seconds * 1000));
      } else {
        const dt = Date.parse(retryAfter);
        if (!Number.isNaN(dt)) retryAfterMs = Math.max(0, dt - Date.now());
      }
    }

    let payload: any = undefined;
    let msg = `Upload failed (${res.status})`;
    try {
      payload = await res.json();
      msg = payload?.message || payload?.error || msg;
    } catch {
      // ignore
    }
    throw new HttpError(res.status, msg, payload, retryAfterMs);
  }

  const contentType = String(res.headers.get("content-type") || "").toLowerCase();
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    const snippet = text.slice(0, 120);
    throw new Error(`Upload failed: non-JSON response. ${snippet}`);
  }

  const data = await res.json();
  const url = data?.url;
  if (!url) throw new Error("Upload failed: missing url");
  return String(url);
}

async function uploadWithRetry(file: File, opts: UploadOptions): Promise<string> {
  const maxRetries = opts.maxRetries ?? 3;

  let lastErr: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await uploadOnce(file, opts);
    } catch (err: any) {
      // Abort should bubble
      if (err?.name === "AbortError") throw err;

      lastErr = err;

      const status = err instanceof HttpError ? err.status : undefined;
      const isRetryable = status === 429 || status === 502 || status === 503 || status === 504;

      if (!isRetryable || attempt === maxRetries) {
        if (isRetryable && attempt === maxRetries) {
          const base = err?.message || "Upload failed";
          throw new Error(`${base} after ${maxRetries} retries`);
        }
        throw err;
      }

      // Exponential backoff with jitter. Prefer Retry-After when present.
      let waitMs = 500 * Math.pow(2, attempt);
      if (err instanceof HttpError && typeof err.retryAfterMs === "number" && err.retryAfterMs > 0) {
        waitMs = Math.max(waitMs, err.retryAfterMs);
      }
      const jitter = Math.floor(Math.random() * 250);
      waitMs += jitter;

      await sleep(waitMs, opts.signal);
    }
  }

  // Should be unreachable, but keep a clear message.
  const status = lastErr instanceof HttpError ? lastErr.status : undefined;
  const base = lastErr?.message || "Upload failed";
  throw new Error(`${base}${status ? ` (${status})` : ""} after ${maxRetries} retries`);
}

class UploadQueue {
  private config: UploadQueueConfig;
  private active = 0;
  private queue: Array<() => void> = [];
  private inflight = new Map<string, { promise: Promise<string>; startedAt: number }>();
  private recentSuccess = new Map<string, { url: string; at: number }>();

  constructor(config: UploadQueueConfig) {
    this.config = config;
  }

  private runNext() {
    while (this.active < this.config.concurrency && this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) return;
      this.active += 1;
      job();
    }
  }

  enqueue(file: File, opts: UploadOptions = {}) {
    const key = fileKey(file);

    const existing = this.inflight.get(key);
    // Never upload the same file twice concurrently.
    if (existing) {
      return existing.promise;
    }

    const prev = this.recentSuccess.get(key);
    if (prev && Date.now() - prev.at <= this.config.dedupeWindowMs) {
      return Promise.resolve(prev.url);
    }

    const promise = new Promise<string>((resolve, reject) => {
      const start = async () => {
        try {
          const url = await uploadWithRetry(file, opts);
          this.recentSuccess.set(key, { url, at: Date.now() });
          resolve(url);
        } catch (e) {
          reject(e);
        } finally {
          this.active = Math.max(0, this.active - 1);
          // Clear inflight after completion; allow re-upload later.
          this.inflight.delete(key);
          this.runNext();
        }
      };

      // If we have capacity, run immediately; else queue.
      if (this.active < this.config.concurrency) {
        this.active += 1;
        void start();
      } else {
        this.queue.push(() => void start());
      }
    });

    this.inflight.set(key, { promise, startedAt: Date.now() });
    return promise;
  }
}

const defaultQueue = new UploadQueue({ concurrency: 1, dedupeWindowMs: 1500 });

export type UploadResult = {
  url: string;
  retriesAttempted: number;
};

export async function uploadImageQueued(file: File, opts: UploadOptions = {}): Promise<string> {
  return defaultQueue.enqueue(file, { ...opts, endpoint: opts.endpoint ?? "/api/upload/image", fieldName: opts.fieldName ?? "image" });
}
