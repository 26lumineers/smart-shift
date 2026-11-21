/**
 * PIN hashing ด้วย PBKDF2-SHA256 (WebCrypto — ทำงานได้ทั้ง Workers และ Node)
 * เก็บรูปแบบ "pbkdf2:<iterations>:<salt hex>:<hash hex>"
 * ระบบเดิมเก็บรหัสเป็น plain text — ระบบใหม่ห้ามทำแบบนั้น
 */

const ITERATIONS = 100_000;
const KEY_BITS = 256;

/** PIN = ตัวเลข 6 หลัก (ใช้ตอน seed, login และเปลี่ยน PIN) */
export const PIN_LENGTH = 6;

export function isValidPin(pin: string): boolean {
  return pin.length === PIN_LENGTH && /^\d+$/.test(pin);
}

const encoder = new TextEncoder();

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

async function derive(
  pin: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
): Promise<Uint8Array<ArrayBuffer>> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    KEY_BITS,
  );
  return new Uint8Array(bits);
}

export async function hashPin(pin: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(pin, salt, ITERATIONS);
  return `pbkdf2:${ITERATIONS}:${toHex(salt)}:${toHex(hash)}`;
}

export async function verifyPin(pin: string, stored: string): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = Number(parts[1]);
  if (!Number.isFinite(iterations) || iterations <= 0) return false;
  const hash = await derive(pin, fromHex(parts[2]), iterations);
  const expected = fromHex(parts[3]);
  if (expected.length !== hash.length) return false;
  // เปรียบเทียบแบบ constant-time
  let diff = 0;
  for (let i = 0; i < hash.length; i++) {
    diff |= hash[i] ^ expected[i];
  }
  return diff === 0;
}

/** สุ่ม PIN 6 หลัก (ใช้ตอน seed เท่านั้น) */
export function randomPin(): string {
  const buf = crypto.getRandomValues(new Uint32Array(1));
  return String(buf[0] % 1_000_000).padStart(6, "0");
}
