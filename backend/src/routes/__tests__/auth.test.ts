import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import app from "../../app.js";
import { db } from "../../db/index.js";
import { users, refreshTokens, passwordResetTokens, userProfiles } from "../../db/schema.js";
import { eq, gt } from "drizzle-orm";
import {
  generateAccessToken,
  hashResetToken,
  generateResetToken,
  hashPassword,
} from "../../utils/auth.js";

const TEST_EMAIL = "reset-test@ci.example.com";
const REGISTER_EMAIL = "register-test@ci.example.com";
const TEST_PASSWORD = "test-password-123";
const TEST_NAME = "Reset Test User";

describe("Auth Routes", () => {
  let testUserId: number;
  let testToken: string;

  beforeAll(async () => {
    // Clean up any leftover test data
    await db.delete(users).where(eq(users.email, TEST_EMAIL));
    await db.delete(users).where(eq(users.email, REGISTER_EMAIL));

    // Create the main test user via direct DB insert — no dependency on register endpoint
    const hashedPassword = await hashPassword(TEST_PASSWORD);
    const [inserted] = await db
      .insert(users)
      .values({
        email: TEST_EMAIL,
        password_hash: hashedPassword,
        name: TEST_NAME,
      })
      .returning({ id: users.id });

    testUserId = inserted.id;
    testToken = generateAccessToken(testUserId);

    // Create the user profile (register normally creates this)
    await db.insert(userProfiles).values({ user_id: testUserId });
  });

  afterAll(async () => {
    // Clean up all test data (cascade deletes tokens, profiles, etc.)
    await db.delete(users).where(eq(users.email, TEST_EMAIL));
    await db.delete(users).where(eq(users.email, REGISTER_EMAIL));
  });

  // ──────────────────────────────────────────────────────
  // Registration (uses separate REGISTER_EMAIL)
  // ──────────────────────────────────────────────────────

  describe("POST /auth/register", () => {
    it("creates a user and returns tokens", async () => {
      const res = await request(app)
        .post("/auth/register")
        .send({ email: REGISTER_EMAIL, password: TEST_PASSWORD, name: "Register Test" });

      expect(res.status).toBe(201);
      expect(res.body.user).toMatchObject({ email: REGISTER_EMAIL });
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
    });

    it("rejects duplicate email with 409", async () => {
      const res = await request(app)
        .post("/auth/register")
        .send({ email: REGISTER_EMAIL, password: TEST_PASSWORD });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain("already registered");
    });
  });

  // ──────────────────────────────────────────────────────
  // Login
  // ──────────────────────────────────────────────────────

  describe("POST /auth/login", () => {
    it("returns tokens with valid credentials", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.email).toBe(TEST_EMAIL);
    });

    it("rejects wrong password with 401", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({ email: TEST_EMAIL, password: "wrong-password" });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid credentials");
    });

    it("rejects nonexistent email with 401", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({ email: "nobody@ci.example.com", password: "whatever" });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid credentials");
    });
  });

  // ──────────────────────────────────────────────────────
  // Token Refresh
  // ──────────────────────────────────────────────────────

  describe("POST /auth/refresh", () => {
    let validRefreshToken: string;

    beforeAll(async () => {
      // Login to get a fresh refresh token
      const res = await request(app)
        .post("/auth/login")
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
      validRefreshToken = res.body.refreshToken;
    });

    it("returns new tokens with a valid refresh token", async () => {
      const res = await request(app)
        .post("/auth/refresh")
        .send({ refreshToken: validRefreshToken });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();

      // The old token is rotated; save new one for later tests if needed
      validRefreshToken = res.body.refreshToken;
    });

    it("rejects an invalid/expired refresh token with 401", async () => {
      const res = await request(app)
        .post("/auth/refresh")
        .send({ refreshToken: "garbage-token" });

      expect(res.status).toBe(401);
    });
  });

  // ──────────────────────────────────────────────────────
  // Logout
  // ──────────────────────────────────────────────────────

  describe("POST /auth/logout", () => {
    it("invalidates the refresh token", async () => {
      // Clear all existing refresh tokens so we have a clean slate
      await db.delete(refreshTokens).where(eq(refreshTokens.user_id, testUserId));

      // Login to get a single token
      const loginRes = await request(app)
        .post("/auth/login")
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
      const refreshToken = loginRes.body.refreshToken;

      // Logout
      const logoutRes = await request(app)
        .post("/auth/logout")
        .send({ refreshToken });
      expect(logoutRes.status).toBe(200);

      // Refresh with the old token should fail
      const refreshRes = await request(app)
        .post("/auth/refresh")
        .send({ refreshToken });
      expect(refreshRes.status).toBe(401);
    });
  });

  // ──────────────────────────────────────────────────────
  // GET /auth/me
  // ──────────────────────────────────────────────────────

  describe("GET /auth/me", () => {
    it("returns current user with valid token", async () => {
      const res = await request(app)
        .get("/auth/me")
        .set("Authorization", `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe(TEST_EMAIL);
      expect(res.body).toHaveProperty("has_password");
    });

    it("rejects unauthenticated request", async () => {
      const res = await request(app).get("/auth/me");
      expect(res.status).toBe(401);
    });
  });

  // ──────────────────────────────────────────────────────
  // PUT /auth/password
  // ──────────────────────────────────────────────────────

  describe("PUT /auth/password", () => {
    const NEW_PASSWORD = "updated-password-456";

    // Guarantee TEST_PASSWORD is restored regardless of individual test outcomes
    afterEach(async () => {
      const restoredHash = await hashPassword(TEST_PASSWORD);
      await db.update(users).set({ password_hash: restoredHash }).where(eq(users.id, testUserId));
    });

    it("changes the password", async () => {
      const res = await request(app)
        .put("/auth/password")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ current_password: TEST_PASSWORD, new_password: NEW_PASSWORD });

      expect(res.status).toBe(200);

      // Can login with new password
      const loginRes = await request(app)
        .post("/auth/login")
        .send({ email: TEST_EMAIL, password: NEW_PASSWORD });
      expect(loginRes.status).toBe(200);
    });

    it("rejects incorrect current password", async () => {
      const res = await request(app)
        .put("/auth/password")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ current_password: "wrong", new_password: "new-pass-12345" });

      expect(res.status).toBe(401);
    });
  });

  // ──────────────────────────────────────────────────────
  // Forgot Password
  // ──────────────────────────────────────────────────────

  describe("POST /auth/forgot-password", () => {
    it("returns 200 with generic message for valid email", async () => {
      const res = await request(app)
        .post("/auth/forgot-password")
        .send({ email: TEST_EMAIL });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/if an account/i);
    });

    it("returns same 200 for nonexistent email (anti-enumeration)", async () => {
      const res = await request(app)
        .post("/auth/forgot-password")
        .send({ email: "nobody@ci.example.com" });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/if an account/i);
    });

    it("returns same 200 for OAuth-only user", async () => {
      // Create an OAuth-only user (no password_hash)
      const oauthEmail = "oauth-test@ci.example.com";
      await db.delete(users).where(eq(users.email, oauthEmail));
      await db.insert(users).values({
        email: oauthEmail,
        password_hash: null,
        name: "OAuth User",
      });

      const res = await request(app)
        .post("/auth/forgot-password")
        .send({ email: oauthEmail });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/if an account/i);

      // Clean up
      await db.delete(users).where(eq(users.email, oauthEmail));
    });

    it("rejects invalid email format with 400", async () => {
      const res = await request(app)
        .post("/auth/forgot-password")
        .send({ email: "not-an-email" });

      expect(res.status).toBe(400);
    });

    it("stores a token row with future expiry", async () => {
      // Clear any existing tokens
      await db.delete(passwordResetTokens).where(eq(passwordResetTokens.user_id, testUserId));

      await request(app)
        .post("/auth/forgot-password")
        .send({ email: TEST_EMAIL });

      // Verify a token row was inserted for this user with a future expires_at
      const rows = await db
        .select()
        .from(passwordResetTokens)
        .where(eq(passwordResetTokens.user_id, testUserId));

      expect(rows).toHaveLength(1);
      expect(new Date(rows[0].expires_at).getTime()).toBeGreaterThan(Date.now());

      // Clean up
      await db.delete(passwordResetTokens).where(eq(passwordResetTokens.user_id, testUserId));
    });
  });

  // ──────────────────────────────────────────────────────
  // Reset Password
  // ──────────────────────────────────────────────────────

  describe("POST /auth/reset-password", () => {
    // Guarantee TEST_PASSWORD is restored regardless of individual test outcomes
    afterEach(async () => {
      const restoredHash = await hashPassword(TEST_PASSWORD);
      await db.update(users).set({ password_hash: restoredHash }).where(eq(users.id, testUserId));
      await db.delete(passwordResetTokens).where(eq(passwordResetTokens.user_id, testUserId));
    });

    it("resets password with a valid token", async () => {
      const plainToken = generateResetToken();
      const tokenHash = hashResetToken(plainToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.insert(passwordResetTokens).values({
        user_id: testUserId,
        token_hash: tokenHash,
        expires_at: expiresAt,
      });

      const newPassword = "reset-new-pass-789";
      const res = await request(app)
        .post("/auth/reset-password")
        .send({ token: plainToken, password: newPassword });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/reset successfully/i);

      // Can login with the new password
      const loginRes = await request(app)
        .post("/auth/login")
        .send({ email: TEST_EMAIL, password: newPassword });
      expect(loginRes.status).toBe(200);
    });

    it("rejects an expired token with 400", async () => {
      const plainToken = generateResetToken();
      const tokenHash = hashResetToken(plainToken);
      const expiredAt = new Date(Date.now() - 1000); // already expired

      await db.insert(passwordResetTokens).values({
        user_id: testUserId,
        token_hash: tokenHash,
        expires_at: expiredAt,
      });

      const res = await request(app)
        .post("/auth/reset-password")
        .send({ token: plainToken, password: "new-password-123" });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/invalid or expired/i);
    });

    it("rejects a used (consumed) token with 400 on reuse", async () => {
      const plainToken = generateResetToken();
      const tokenHash = hashResetToken(plainToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await db.insert(passwordResetTokens).values({
        user_id: testUserId,
        token_hash: tokenHash,
        expires_at: expiresAt,
      });

      // First use — should succeed
      await request(app)
        .post("/auth/reset-password")
        .send({ token: plainToken, password: "first-reset-123" });

      // Second use — should fail (token deleted after first use)
      const res = await request(app)
        .post("/auth/reset-password")
        .send({ token: plainToken, password: "second-reset-123" });

      expect(res.status).toBe(400);
    });

    it("rejects a garbage token with 400", async () => {
      const res = await request(app)
        .post("/auth/reset-password")
        .send({ token: "completely-invalid-token", password: "new-password-123" });

      expect(res.status).toBe(400);
    });

    it("rejects a short password with 400 (Zod validation)", async () => {
      const plainToken = generateResetToken();
      const tokenHash = hashResetToken(plainToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await db.insert(passwordResetTokens).values({
        user_id: testUserId,
        token_hash: tokenHash,
        expires_at: expiresAt,
      });

      const res = await request(app)
        .post("/auth/reset-password")
        .send({ token: plainToken, password: "short" });

      expect(res.status).toBe(400);
    });

    it("second forgot-password invalidates the first token", async () => {
      // Insert first token
      const firstToken = generateResetToken();
      const firstHash = hashResetToken(firstToken);
      await db.insert(passwordResetTokens).values({
        user_id: testUserId,
        token_hash: firstHash,
        expires_at: new Date(Date.now() + 60 * 60 * 1000),
      });

      // Trigger forgot-password which deletes old tokens and creates a new one
      await request(app)
        .post("/auth/forgot-password")
        .send({ email: TEST_EMAIL });

      // First token should no longer work
      const res = await request(app)
        .post("/auth/reset-password")
        .send({ token: firstToken, password: "new-password-123" });

      expect(res.status).toBe(400);
    });

    it("reset invalidates all refresh tokens", async () => {
      // Login to get a refresh token
      const loginRes = await request(app)
        .post("/auth/login")
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
      const refreshToken = loginRes.body.refreshToken;

      // Insert a reset token
      const plainToken = generateResetToken();
      const tokenHash = hashResetToken(plainToken);
      await db.insert(passwordResetTokens).values({
        user_id: testUserId,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + 60 * 60 * 1000),
      });

      // Reset password
      await request(app)
        .post("/auth/reset-password")
        .send({ token: plainToken, password: "after-reset-pass-123" });

      // Old refresh token should be invalidated
      const refreshRes = await request(app)
        .post("/auth/refresh")
        .send({ refreshToken });

      expect(refreshRes.status).toBe(401);
    });
  });
});
