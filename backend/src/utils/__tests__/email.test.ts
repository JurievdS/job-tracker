import { describe, it, expect } from "vitest";
import { buildPasswordResetEmail } from "../email.js";

describe("buildPasswordResetEmail", () => {
  const resetUrl = "https://app.example.com/reset-password?token=abc123";

  it("html body contains the reset URL", () => {
    const result = buildPasswordResetEmail(resetUrl);
    expect(result.html).toContain(resetUrl);
  });

  it("text body contains the reset URL", () => {
    const result = buildPasswordResetEmail(resetUrl);
    expect(result.text).toContain(resetUrl);
  });

});
