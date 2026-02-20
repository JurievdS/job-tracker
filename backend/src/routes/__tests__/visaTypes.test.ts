import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../app.js";
import { db } from "../../db/index.js";
import { users, userProfiles, visaTypes, visaRequirements } from "../../db/schema.js";
import { eq, ilike } from "drizzle-orm";
import { generateAccessToken, hashPassword } from "../../utils/auth.js";

const TEST_EMAIL = "visa-test@ci.example.com";
const TEST_PASSWORD = "test-password-123";

describe("Visa Type Routes", () => {
  let testUserId: number;
  let testToken: string;

  beforeAll(async () => {
    await db.delete(users).where(eq(users.email, TEST_EMAIL));
    await db.delete(visaTypes).where(ilike(visaTypes.name, "%CI Test Visa%"));

    const hashedPassword = await hashPassword(TEST_PASSWORD);
    const [inserted] = await db
      .insert(users)
      .values({ email: TEST_EMAIL, password_hash: hashedPassword, name: "Visa Test" })
      .returning({ id: users.id });

    testUserId = inserted.id;
    testToken = generateAccessToken(testUserId);
    await db.insert(userProfiles).values({ user_id: testUserId });
  });

  afterAll(async () => {
    await db.delete(users).where(eq(users.email, TEST_EMAIL));
    await db.delete(visaTypes).where(ilike(visaTypes.name, "%CI Test Visa%"));
  });

  // ── POST /visa-types ───────────────────────────────────
  describe("POST /visa-types", () => {
    it("creates (201)", async () => {
      const res = await request(app)
        .post("/visa-types")
        .set("Authorization", `Bearer ${testToken}`)
        .send({
          country_code: "NLD",
          name: "CI Test Visa Alpha",
          valid_from: "2024-01-01",
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("CI Test Visa Alpha");
      expect(res.body.country_code).toBe("NLD");
    });

    it("rejects duplicate country+name+valid_from (409)", async () => {
      const res = await request(app)
        .post("/visa-types")
        .set("Authorization", `Bearer ${testToken}`)
        .send({
          country_code: "NLD",
          name: "CI Test Visa Alpha",
          valid_from: "2024-01-01",
        });

      expect(res.status).toBe(409);
    });

    it("rejects missing required fields (400)", async () => {
      const res = await request(app)
        .post("/visa-types")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ country_code: "NLD" });

      expect(res.status).toBe(400);
    });
  });

  // ── GET /visa-types ────────────────────────────────────
  describe("GET /visa-types", () => {
    it("lists all", async () => {
      const res = await request(app)
        .get("/visa-types")
        .set("Authorization", `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it("filters by country", async () => {
      const res = await request(app)
        .get("/visa-types?country=NLD")
        .set("Authorization", `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      for (const vt of res.body) {
        expect(vt.country_code).toBe("NLD");
      }
    });
  });

  // ── GET /visa-types/:id ────────────────────────────────
  describe("GET /visa-types/:id", () => {
    let visaTypeId: number;

    beforeAll(async () => {
      const res = await request(app)
        .post("/visa-types")
        .set("Authorization", `Bearer ${testToken}`)
        .send({
          country_code: "DEU",
          name: "CI Test Visa GetById",
          valid_from: "2024-01-01",
        });
      visaTypeId = res.body.id;
    });

    it("returns by ID", async () => {
      const res = await request(app)
        .get(`/visa-types/${visaTypeId}`)
        .set("Authorization", `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(visaTypeId);
    });

    it("returns 404 for nonexistent", async () => {
      const res = await request(app)
        .get("/visa-types/999999")
        .set("Authorization", `Bearer ${testToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ── PUT /visa-types/:id ────────────────────────────────
  describe("PUT /visa-types/:id", () => {
    let visaTypeId: number;

    beforeAll(async () => {
      const res = await request(app)
        .post("/visa-types")
        .set("Authorization", `Bearer ${testToken}`)
        .send({
          country_code: "ZAF",
          name: "CI Test Visa Update",
          valid_from: "2024-01-01",
        });
      visaTypeId = res.body.id;
    });

    it("updates", async () => {
      const res = await request(app)
        .put(`/visa-types/${visaTypeId}`)
        .set("Authorization", `Bearer ${testToken}`)
        .send({ description: "Updated description" });

      expect(res.status).toBe(200);
      expect(res.body.description).toBe("Updated description");
    });
  });

  // ── DELETE /visa-types/:id ─────────────────────────────
  describe("DELETE /visa-types/:id", () => {
    it("deletes (204)", async () => {
      const createRes = await request(app)
        .post("/visa-types")
        .set("Authorization", `Bearer ${testToken}`)
        .send({
          country_code: "GBR",
          name: "CI Test Visa Delete",
          valid_from: "2024-06-01",
        });

      const res = await request(app)
        .delete(`/visa-types/${createRes.body.id}`)
        .set("Authorization", `Bearer ${testToken}`);

      expect(res.status).toBe(204);
    });
  });

  // ── Requirements (nested) ──────────────────────────────
  describe("Visa Requirements", () => {
    let visaTypeId: number;

    beforeAll(async () => {
      const res = await request(app)
        .post("/visa-types")
        .set("Authorization", `Bearer ${testToken}`)
        .send({
          country_code: "NLD",
          name: "CI Test Visa Reqs",
          valid_from: "2024-01-01",
        });
      visaTypeId = res.body.id;
    });

    it("POST creates requirement (201)", async () => {
      const res = await request(app)
        .post(`/visa-types/${visaTypeId}/requirements`)
        .set("Authorization", `Bearer ${testToken}`)
        .send({
          visa_type_id: visaTypeId,
          requirement_type: "salary_min",
          min_value: 46107,
          currency: "EUR",
          period: "annual",
        });

      expect(res.status).toBe(201);
      expect(res.body.requirement_type).toBe("salary_min");
    });

    it("GET lists requirements", async () => {
      const res = await request(app)
        .get(`/visa-types/${visaTypeId}/requirements`)
        .set("Authorization", `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });
});
