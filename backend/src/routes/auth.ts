import { Router, Request, Response } from "express";
import passport from "../config/passport.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { authenticate } from "../middleware/auth.js";
import { db } from "../db/index.js";
import { users, refreshTokens } from "../db/schema.js";
import { eq, and, gt } from "drizzle-orm";
import { RegisterSchema, LoginSchema, RefreshTokenSchema } from "../schemas/auth.js";
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  hashToken,
  verifyTokenHash,
} from "../utils/auth.js";
import type { OAuthUser } from "../config/passport.js";

const router = Router();
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

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

// Google OAuth routes
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

// GitHub OAuth routes
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

export default router;
