import { Router, Request, Response } from "express";
import passport from "../config/passport.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { authenticate } from "../middleware/auth.js";
import { db } from "../db/index.js";
import { users, refreshTokens, userProfiles, passwordResetTokens } from "../db/schema.js";
import { eq, and, gt, sql } from "drizzle-orm";
import { RegisterSchema, LoginSchema, RefreshTokenSchema, ChangePasswordSchema, UpdateAccountSchema, ForgotPasswordSchema, ResetPasswordSchema } from "../schemas/auth.js";
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  hashToken,
  verifyTokenHash,
  generateResetToken,
  hashResetToken,
} from "../utils/auth.js";
import { sendEmail, buildPasswordResetEmail } from "../utils/email.js";
import type { OAuthUser } from "../config/passport.js";

const router = Router();
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// Check if OAuth providers are configured
const GOOGLE_ENABLED = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const GITHUB_ENABLED = !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       409:
 *         description: Email already registered
 */
router.post(
  "/register",
  asyncHandler(async (req: Request, res: Response) => {
    const data = RegisterSchema.parse(req.body);

    // Check if user exists
    const existing = await db.select().from(users).where(eq(users.email, data.email));
    if (existing.length > 0) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const password_hash = await hashPassword(data.password);

    const result = await db
      .insert(users)
      .values({
        email: data.email,
        password_hash,
        name: data.name,
      })
      .returning({ id: users.id, email: users.email, name: users.name });

    // Create user profile with pre-populated name
    await db.insert(userProfiles).values({
      user_id: result[0].id,
      full_name: data.name,
    });

    const accessToken = generateAccessToken(result[0].id);
    const refreshToken = generateRefreshToken(result[0].id);

    // Store refresh token hash
    const tokenHash = await hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await db.insert(refreshTokens).values({
      user_id: result[0].id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    res.status(201).json({
      user: result[0],
      accessToken,
      refreshToken,
    });
  })
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post(
  "/login",
  asyncHandler(async (req: Request, res: Response) => {
    const data = LoginSchema.parse(req.body);

    const result = await db.select().from(users).where(eq(users.email, data.email));
    if (result.length === 0) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const user = result[0];

    if (!user.password_hash) {
      res.status(401).json({ error: "Please use OAuth login for this account" });
      return;
    }

    const valid = await verifyPassword(data.password, user.password_hash);

    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token hash
    const tokenHash = await hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await db.insert(refreshTokens).values({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
      refreshToken,
    });
  })
);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post(
  "/refresh",
  asyncHandler(async (req: Request, res: Response) => {
    const data = RefreshTokenSchema.parse(req.body);

    let payload;
    try {
      payload = verifyToken(data.refreshToken);
      if (payload.type !== "refresh") {
        res.status(401).json({ error: "Invalid token type" });
        return;
      }
    } catch {
      res.status(401).json({ error: "Invalid or expired refresh token" });
      return;
    }

    // Find valid refresh tokens for this user
    const storedTokens = await db
      .select()
      .from(refreshTokens)
      .where(
        and(eq(refreshTokens.user_id, payload.userId), gt(refreshTokens.expires_at, new Date()))
      );

    // Verify the token hash matches one of the stored tokens
    let validToken = false;
    let tokenId: number | null = null;
    for (const storedToken of storedTokens) {
      if (await verifyTokenHash(data.refreshToken, storedToken.token_hash)) {
        validToken = true;
        tokenId = storedToken.id;
        break;
      }
    }

    if (!validToken || tokenId === null) {
      res.status(401).json({ error: "Invalid or expired refresh token" });
      return;
    }

    // Delete the used refresh token (rotation)
    await db.delete(refreshTokens).where(eq(refreshTokens.id, tokenId));

    // Generate new tokens
    const newAccessToken = generateAccessToken(payload.userId);
    const newRefreshToken = generateRefreshToken(payload.userId);

    // Store new refresh token
    const newTokenHash = await hashToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await db.insert(refreshTokens).values({
      user_id: payload.userId,
      token_hash: newTokenHash,
      expires_at: expiresAt,
    });

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  })
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout and invalidate refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post(
  "/logout",
  asyncHandler(async (req: Request, res: Response) => {
    const data = RefreshTokenSchema.parse(req.body);

    let payload;
    try {
      payload = verifyToken(data.refreshToken);
    } catch {
      // Token invalid, but logout should still succeed
      res.json({ message: "Logged out successfully" });
      return;
    }

    // Find and delete the refresh token
    const storedTokens = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.user_id, payload.userId));

    for (const storedToken of storedTokens) {
      if (await verifyTokenHash(data.refreshToken, storedToken.token_hash)) {
        await db.delete(refreshTokens).where(eq(refreshTokens.id, storedToken.id));
        break;
      }
    }

    res.json({ message: "Logged out successfully" });
  })
);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password reset email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Always returns success to prevent email enumeration
 */
router.post(
  "/forgot-password",
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = ForgotPasswordSchema.parse(req.body);

    const successMessage = "If an account with that email exists, we've sent a password reset link.";

    // Look up user
    const result = await db.select().from(users).where(eq(users.email, email));
    if (result.length === 0 || !result[0].password_hash) {
      // No user or OAuth-only account — return same response
      res.json({ message: successMessage });
      return;
    }

    const user = result[0];

    // Delete existing tokens for this user
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.user_id, user.id));

    // Generate and store new token
    const plainToken = generateResetToken();
    const tokenHash = hashResetToken(plainToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.insert(passwordResetTokens).values({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    // Send email
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${plainToken}`;
    const emailContent = buildPasswordResetEmail(resetUrl);
    await sendEmail({ to: email, ...emailContent });

    res.json({ message: successMessage });
  })
);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using a reset token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired reset link
 */
router.post(
  "/reset-password",
  asyncHandler(async (req: Request, res: Response) => {
    const { token, password } = ResetPasswordSchema.parse(req.body);

    // Hash the submitted token and look up matching record
    const tokenHash = hashResetToken(token);
    const result = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token_hash, tokenHash),
          gt(passwordResetTokens.expires_at, new Date())
        )
      );

    if (result.length === 0) {
      res.status(400).json({ error: "Invalid or expired reset link. Please request a new one." });
      return;
    }

    const resetRecord = result[0];

    // Update password
    const newHash = await hashPassword(password);
    await db.update(users).set({ password_hash: newHash, updated_at: new Date() }).where(eq(users.id, resetRecord.user_id));

    // Delete all reset tokens for this user
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.user_id, resetRecord.user_id));

    // Invalidate all refresh tokens (force re-login on all devices)
    await db.delete(refreshTokens).where(eq(refreshTokens.user_id, resetRecord.user_id));

    res.json({ message: "Password has been reset successfully. You can now sign in with your new password." });
  })
);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user info
 *       401:
 *         description: Not authenticated
 */
router.get(
  "/me",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        avatar_url: users.avatar_url,
        created_at: users.created_at,
        has_password: sql<boolean>`${users.password_hash} IS NOT NULL`.as("has_password"),
        google_connected: sql<boolean>`${users.google_id} IS NOT NULL`.as("google_connected"),
        github_connected: sql<boolean>`${users.github_id} IS NOT NULL`.as("github_connected"),
      })
      .from(users)
      .where(eq(users.id, req.userId!));

    if (result.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(result[0]);
  })
);

/**
 * @swagger
 * /auth/password:
 *   put:
 *     summary: Change or set password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [new_password]
 *             properties:
 *               current_password:
 *                 type: string
 *               new_password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password updated
 *       401:
 *         description: Current password incorrect
 */
router.put(
  "/password",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const data = ChangePasswordSchema.parse(req.body);

    const result = await db.select().from(users).where(eq(users.id, req.userId!));
    if (result.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const user = result[0];

    // If user already has a password, verify current password
    if (user.password_hash) {
      if (!data.current_password) {
        res.status(400).json({ error: "Current password is required" });
        return;
      }
      const valid = await verifyPassword(data.current_password, user.password_hash);
      if (!valid) {
        res.status(401).json({ error: "Current password is incorrect" });
        return;
      }
    }

    const newHash = await hashPassword(data.new_password);
    await db.update(users).set({ password_hash: newHash }).where(eq(users.id, req.userId!));

    res.json({ message: "Password updated" });
  })
);

/**
 * @swagger
 * /auth/account:
 *   put:
 *     summary: Update account details (display name)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 255
 *     responses:
 *       200:
 *         description: Account updated
 *       404:
 *         description: User not found
 */
router.put(
  "/account",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const data = UpdateAccountSchema.parse(req.body);

    if (data.name !== undefined) {
      await db
        .update(users)
        .set({ name: data.name, updated_at: new Date() })
        .where(eq(users.id, req.userId!));
    }

    const result = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        avatar_url: users.avatar_url,
        created_at: users.created_at,
        has_password: sql<boolean>`${users.password_hash} IS NOT NULL`.as("has_password"),
        google_connected: sql<boolean>`${users.google_id} IS NOT NULL`.as("google_connected"),
        github_connected: sql<boolean>`${users.github_id} IS NOT NULL`.as("github_connected"),
      })
      .from(users)
      .where(eq(users.id, req.userId!));

    if (result.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(result[0]);
  })
);

/**
 * @swagger
 * /auth/account:
 *   delete:
 *     summary: Delete user account and all associated data
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Account deleted
 *       404:
 *         description: User not found
 */
router.delete(
  "/account",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await db.delete(users).where(eq(users.id, req.userId!)).returning({ id: users.id });

    if (result.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(204).send();
  })
);

// Google OAuth routes
if (GOOGLE_ENABLED) {
  /**
   * @swagger
   * /auth/google:
   *   get:
   *     summary: Initiate Google OAuth login
   *     tags: [Auth]
   *     responses:
   *       302:
   *         description: Redirect to Google
   */
  router.get("/google", passport.authenticate("google", { session: false }));

  router.get(
    "/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: `${FRONTEND_URL}/login?error=google_auth_failed` }),
    asyncHandler(async (req: Request, res: Response) => {
      const user = req.user as OAuthUser;

      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);

      // Store refresh token hash
      const tokenHash = await hashToken(refreshToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await db.insert(refreshTokens).values({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      });

      // Redirect to frontend with tokens
      res.redirect(
        `${FRONTEND_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
      );
    })
  );
} else {
  // Fallback when Google OAuth is not configured
  router.get("/google", (_req: Request, res: Response) => {
    res.status(501).json({ error: "Google OAuth is not configured" });
  });
}

// GitHub OAuth routes
if (GITHUB_ENABLED) {
  /**
   * @swagger
   * /auth/github:
   *   get:
   *     summary: Initiate GitHub OAuth login
   *     tags: [Auth]
   *     responses:
   *       302:
   *         description: Redirect to GitHub
   */
  router.get("/github", passport.authenticate("github", { session: false }));

  router.get(
    "/github/callback",
    passport.authenticate("github", { session: false, failureRedirect: `${FRONTEND_URL}/login?error=github_auth_failed` }),
    asyncHandler(async (req: Request, res: Response) => {
      const user = req.user as OAuthUser;

      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);

      // Store refresh token hash
      const tokenHash = await hashToken(refreshToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await db.insert(refreshTokens).values({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      });

      // Redirect to frontend with tokens
      res.redirect(
        `${FRONTEND_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
      );
    })
  );
} else {
  // Fallback when GitHub OAuth is not configured
  router.get("/github", (_req: Request, res: Response) => {
    res.status(501).json({ error: "GitHub OAuth is not configured" });
  });
}

export default router;
