import { describe, it, expect } from "vitest";
import {
  generateResetToken,
  hashResetToken,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  hashPassword,
  verifyPassword,
} from "../auth.js";

describe("generateResetToken", () => {
  it("returns a 64-char hex string", () => {
    const token = generateResetToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("returns unique values on each call", () => {
    const a = generateResetToken();
    const b = generateResetToken();
    expect(a).not.toBe(b);
  });
});

describe("hashResetToken", () => {
  it("returns a 64-char hex string (SHA-256)", () => {
    const hash = hashResetToken("test-token");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic — same input produces same hash", () => {
    const a = hashResetToken("same-input");
    const b = hashResetToken("same-input");
    expect(a).toBe(b);
  });

});

describe("verifyToken", () => {
  it("round-trips with generateAccessToken", () => {
    const token = generateAccessToken(42);
    const payload = verifyToken(token);
    expect(payload.userId).toBe(42);
    expect(payload.type).toBe("access");
  });

  it("round-trips with generateRefreshToken", () => {
    const token = generateRefreshToken(7);
    const payload = verifyToken(token);
    expect(payload.userId).toBe(7);
    expect(payload.type).toBe("refresh");
  });

  it("rejects garbage input", () => {
    expect(() => verifyToken("not.a.jwt")).toThrow();
  });
});

describe("hashPassword / verifyPassword", () => {
  it("round-trips correctly — hash then verify succeeds", async () => {
    const hash = await hashPassword("my-password");
    const ok = await verifyPassword("my-password", hash);
    expect(ok).toBe(true);
  });

  it("rejects wrong password", async () => {
    const hash = await hashPassword("correct-password");
    const ok = await verifyPassword("wrong-password", hash);
    expect(ok).toBe(false);
  });
});
