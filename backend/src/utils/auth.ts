import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || "development-secret-change-in-production";
const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_EXPIRY || "15m";
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRY || "7d";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface TokenPayload {
  userId: number;
  type?: "access" | "refresh";
}

export function generateAccessToken(userId: number): string {
  const options: SignOptions = { expiresIn: ACCESS_TOKEN_EXPIRY as jwt.SignOptions["expiresIn"] };
  return jwt.sign({ userId, type: "access" } as TokenPayload, JWT_SECRET, options);
}

export function generateRefreshToken(userId: number): string {
  const options: SignOptions = { expiresIn: REFRESH_TOKEN_EXPIRY as jwt.SignOptions["expiresIn"] };
  return jwt.sign({ userId, type: "refresh" } as TokenPayload, JWT_SECRET, options);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

export async function hashToken(token: string): Promise<string> {
  return bcrypt.hash(token, 10);
}

export async function verifyTokenHash(token: string, hash: string): Promise<boolean> {
  return bcrypt.compare(token, hash);
}
