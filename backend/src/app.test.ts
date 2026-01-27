import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "./app.js";
import { generateAccessToken } from "./utils/auth.js";
import { db } from "./db/index.js";
import { users, companies } from "./db/schema.js";
import { eq } from "drizzle-orm";

describe("API", () => {
  let testToken: string;
  let testUserId: number;

  beforeAll(async () => {
    // Clean up any existing test user
    await db.delete(users).where(eq(users.email, "test@ci.example.com"));

    // Create test user directly in DB
    const [user] = await db
      .insert(users)
      .values({
        email: "test@ci.example.com",
        password_hash: "not-used-in-tests",
        name: "CI Test User",
      })
      .returning();

    testUserId = user.id;
    testToken = generateAccessToken(testUserId);
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(companies).where(eq(companies.name, "Test Company"));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  describe("Authentication", () => {
    it("should reject unauthenticated requests to protected routes", async () => {
      const res = await request(app).get("/companies");
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Authentication required");
    });

    it("should reject invalid tokens", async () => {
      const res = await request(app)
        .get("/companies")
        .set("Authorization", "Bearer invalid-token");
      expect(res.status).toBe(401);
    });

    it("should allow access to auth endpoints without token", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({ email: "nonexistent@test.com", password: "password" });
      // Should get 401 (invalid credentials), not 401 (no token)
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid credentials");
    });
  });

  describe("Protected Routes", () => {
    it("should return API status on root with auth", async () => {
      const res = await request(app)
        .get("/")
        .set("Authorization", `Bearer ${testToken}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Job Tracker API");
    });

    it("should return companies list with auth", async () => {
      const res = await request(app)
        .get("/companies")
        .set("Authorization", `Bearer ${testToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("should return 404 for non-existent company with auth", async () => {
      const res = await request(app)
        .get("/companies/99999")
        .set("Authorization", `Bearer ${testToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe("User Scoping", () => {
    it("should only return companies belonging to the authenticated user", async () => {
      // Create a company for test user
      const createRes = await request(app)
        .post("/companies")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ name: "Test Company" });

      expect(createRes.status).toBe(201);

      // Verify it shows up in the list
      const listRes = await request(app)
        .get("/companies")
        .set("Authorization", `Bearer ${testToken}`);

      expect(
        listRes.body.some((c: { name: string }) => c.name === "Test Company"),
      ).toBe(true);
    });
  });
});