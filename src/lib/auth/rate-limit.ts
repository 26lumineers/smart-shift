/**
 * Rate limit ตอน login (in-memory ต่อ instance ของ Worker — best effort
 * ถ้ามี isolate หลายตัวจะนับแยกกัน แต่ยังกัน brute force พื้นฐานได้)
 */

const WINDOW_MS = 5 * 60_000;
const MAX_ATTEMPTS = 5;

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function get(key: string): Bucket {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    const fresh = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(key, fresh);
    return fresh;
  }
  return b;
}

/** true = ควรถูกปฏิเสธ */
export function isBlocked(key: string): boolean {
  return get(key).count >= MAX_ATTEMPTS;
}

export function recordFailure(key: string): number {
  const b = get(key);
  b.count += 1;
  return Math.max(0, MAX_ATTEMPTS - b.count);
}

export function reset(key: string): void {
  buckets.delete(key);
}

/** ล้าง bucket หมดอายุเป็นระยะ กันหน่วยกลางโต */
export function sweep(): void {
  const now = Date.now();
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}
