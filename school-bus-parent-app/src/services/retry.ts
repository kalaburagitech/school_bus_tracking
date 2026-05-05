export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: { retries?: number; baseMs?: number; maxMs?: number },
): Promise<T> {
  const retries = options?.retries ?? 3;
  const baseMs = options?.baseMs ?? 250;
  const maxMs = options?.maxMs ?? 3000;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt >= retries) break;
      const jitter = Math.floor(Math.random() * 120);
      const wait = Math.min(baseMs * 2 ** attempt + jitter, maxMs);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastError;
}
