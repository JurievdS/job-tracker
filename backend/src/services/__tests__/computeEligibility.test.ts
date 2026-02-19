import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { computeEligibility } from "../ApplicationService.js";

// Minimal WorkAuthorization factory — only fields the function reads
function makeAuth(overrides: {
  country_code: string;
  status: string;
  expiry_date?: string | null;
}) {
  return {
    id: 1,
    user_id: 1,
    country_code: overrides.country_code,
    status: overrides.status,
    expiry_date: overrides.expiry_date ?? null,
    notes: null,
    created_at: new Date(),
  };
}

describe("computeEligibility", () => {
  // Fix "now" so expiry comparisons are deterministic
  const FIXED_NOW = "2025-06-15";
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(`${FIXED_NOW}T00:00:00Z`));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Guard clauses ──────────────────────────────────────
  it("returns null when roleCountryCode is null", () => {
    expect(computeEligibility(null, "yes", [])).toBeNull();
  });

  it("returns null when roleCountryCode is empty string", () => {
    expect(computeEligibility("", "yes", [])).toBeNull();
  });

  // ── Authorized (valid, non-expired) ────────────────────
  it("returns authorized with strongest type (citizen > work_permit)", () => {
    const auths = [
      makeAuth({ country_code: "NLD", status: "work_permit", expiry_date: "2026-01-01" }),
      makeAuth({ country_code: "NLD", status: "citizen" }),
    ];
    const result = computeEligibility("NLD", null, auths);
    expect(result).toEqual({ status: "authorized", auth_type: "citizen" });
  });

  it("returns authorized with citizen when no expiry_date", () => {
    const auths = [makeAuth({ country_code: "ZAF", status: "citizen" })];
    const result = computeEligibility("ZAF", null, auths);
    expect(result).toEqual({ status: "authorized", auth_type: "citizen" });
    // No expiry_date key at all
    expect(result).not.toHaveProperty("expiry_date");
  });

  it("returns authorized with expiry_date when work_permit has future expiry", () => {
    const auths = [
      makeAuth({ country_code: "NLD", status: "work_permit", expiry_date: "2026-03-01" }),
    ];
    const result = computeEligibility("NLD", null, auths);
    expect(result).toEqual({
      status: "authorized",
      auth_type: "work_permit",
      expiry_date: "2026-03-01",
    });
  });

  // ── Expired ─────────────────────────────────────────────
  it("returns expired when all matching auths have past expiry", () => {
    const auths = [
      makeAuth({ country_code: "USA", status: "work_permit", expiry_date: "2024-12-31" }),
    ];
    const result = computeEligibility("USA", null, auths);
    expect(result?.status).toBe("expired");
    expect(result?.auth_type).toBe("work_permit");
    expect(result?.expiry_date).toBe("2024-12-31");
  });

  it("returns expired with most recently expired when multiple expired", () => {
    const auths = [
      makeAuth({ country_code: "USA", status: "student_visa", expiry_date: "2023-06-01" }),
      makeAuth({ country_code: "USA", status: "work_permit", expiry_date: "2025-01-15" }),
    ];
    const result = computeEligibility("USA", null, auths);
    expect(result?.status).toBe("expired");
    // 2025-01-15 is the most recently expired
    expect(result?.expiry_date).toBe("2025-01-15");
  });

  // ── No matching auths — fallback branches ──────────────
  it("returns sponsorship_available when no match + visa_sponsorship='yes'", () => {
    expect(computeEligibility("DEU", "yes", [])).toEqual({
      status: "sponsorship_available",
    });
  });

  it("returns not_authorized when no match + visa_sponsorship='no'", () => {
    expect(computeEligibility("DEU", "no", [])).toEqual({
      status: "not_authorized",
    });
  });

  it("returns unknown when no match + visa_sponsorship is null", () => {
    expect(computeEligibility("DEU", null, [])).toEqual({
      status: "unknown",
    });
  });

  it("returns unknown when no match + visa_sponsorship is other value", () => {
    expect(computeEligibility("DEU", "unknown", [])).toEqual({
      status: "unknown",
    });
  });

  // ── Country filter ─────────────────────────────────────
  it("ignores auths for different countries", () => {
    const auths = [
      makeAuth({ country_code: "ZAF", status: "citizen" }),
    ];
    // Querying for NLD but only have ZAF auth
    const result = computeEligibility("NLD", "no", auths);
    expect(result).toEqual({ status: "not_authorized" });
  });
});
