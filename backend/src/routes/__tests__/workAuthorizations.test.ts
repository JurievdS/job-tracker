import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../app.js";
import { db } from "../../db/index.js";
import { users, userProfiles, workAuthorizations } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { generateAccessToken, hashPassword } from "../../utils/auth.js";

const TEST_EMAIL = "wa-test@ci.example.com";
const TEST_PASSWORD = "test-password-123";

describe("Work Authorization Routes", () => {
  let testUserId: number;
  let testToken: string;

  beforeAll(async () => {
    await db.delete(users).where(eq(users.email, TEST_EMAIL));

    const hashedPassword = await hashPassword(TEST_PASSWORD);
    const [inserted] = await db
      .insert(users)
      .values({ email: TEST_EMAIL, password_hash: hashedPassword, name: "WA Test" })
      .returning({ id: users.id });

    testUserId = inserted.id;
    testToken = generateAccessToken(testUserId);
    await db.insert(userProfiles).values({ user_id: testUserId });
  });

  afterAll(async () => {
    await db.delete(users).where(eq(users.email, TEST_EMAIL));
  });

  // ── POST /work-authorizations ──────────────────────────
  describe("POST /work-authorizations", () => {
    it("creates (201)", async () => {
      const res = await request(app)
        .post("/work-authorizations")
        .set("Authorization", `Bearer ${testToken}`)
        .send({
          country_code: "NLD",
          status: "citizen",
        });

      expect(res.status).toBe(201);
      expect(res.body.country_code).toBe("NLD");
      expect(res.body.status).toBe("citizen");
    });

    it("rejects duplicate user+country+status (409)", async () => {
      const res = await request(app)
        .post("/work-authorizations")
        .set("Authorization", `Bearer ${testToken}`)
        .send({
          country_code: "NLD",
          status: "citizen",
        });

      expect(res.status).toBe(409);
    });

    it("rejects invalid country_code length (400)", async () => {
      const res = await request(app)
        .post("/work-authorizations")
        .set("Authorization", `Bearer ${testToken}`)
        .send({
          country_code: "NL",
          status: "citizen",
        });

      expect(res.status).toBe(400);
    });

    it("rejects invalid status enum (400)", async () => {
      const res = await request(app)
        .post("/work-authorizations")
        .set("Authorization", `Bearer ${testToken}`)
        .send({
          country_code: "DEU",
          status: "invalid_status",
        });

      expect(res.status).toBe(400);
    });
  });

  // ── GET /work-authorizations ───────────────────────────
  describe("GET /work-authorizations", () => {
    it("lists (user-scoped)", async () => {
      const res = await request(app)
        .get("/work-authorizations")
        .set("Authorization", `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      for (const wa of res.body) {
        expect(wa.user_id).toBe(testUserId);
      }
    });
  });

  // ── GET /work-authorizations/:id ───────────────────────
  describe("GET /work-authorizations/:id", () => {
    let waId: number;

    beforeAll(async () => {
      const res = await request(app)
        .post("/work-authorizations")
        .set("Authorization", `Bearer ${testToken}`)
        .send({
          country_code: "ZAF",
          status: "citizen",
        });
      waId = res.body.id;
    });

    it("returns by ID", async () => {
      const res = await request(app)
        .get(`/work-authorizations/${waId}`)
        .set("Authorization", `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(waId);
    });

    it("returns 404 for nonexistent", async () => {
      const res = await request(app)
        .get("/work-authorizations/999999")
        .set("Authorization", `Bearer ${testToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ── PUT /work-authorizations/:id ───────────────────────
  describe("PUT /work-authorizations/:id", () => {
    let waId: number;

    beforeAll(async () => {
      const res = await request(app)
        .post("/work-authorizations")
        .set("Authorization", `Bearer ${testToken}`)
        .send({
          country_code: "DEU",
          status: "work_permit",
          expiry_date: "2026-12-31",
        });
      waId = res.body.id;
    });

    it("updates", async () => {
      const res = await request(app)
        .put(`/work-authorizations/${waId}`)
        .set("Authorization", `Bearer ${testToken}`)
        .send({ notes: "Updated notes" });

      expect(res.status).toBe(200);
      expect(res.body.notes).toBe("Updated notes");
    });
  });

  // ── DELETE /work-authorizations/:id ────────────────────
  describe("DELETE /work-authorizations/:id", () => {
    it("deletes (204)", async () => {
      const createRes = await request(app)
        .post("/work-authorizations")
        .set("Authorization", `Bearer ${testToken}`)
        .send({
          country_code: "GBR",
          status: "work_permit",
          expiry_date: "2027-01-01",
        });

      const res = await request(app)
        .delete(`/work-authorizations/${createRes.body.id}`)
        .set("Authorization", `Bearer ${testToken}`);

      expect(res.status).toBe(204);
    });
  });
});
