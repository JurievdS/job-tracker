import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../app.js";
import { db } from "../../db/index.js";
import { users, userProfiles, companies, contacts } from "../../db/schema.js";
import { eq, ilike } from "drizzle-orm";
import { generateAccessToken, hashPassword } from "../../utils/auth.js";

const TEST_EMAIL = "contact-test@ci.example.com";
const TEST_PASSWORD = "test-password-123";

describe("Contact Routes", () => {
  let testUserId: number;
  let testToken: string;
  let testCompanyId: number;

  beforeAll(async () => {
    await db.delete(users).where(eq(users.email, TEST_EMAIL));
    await db.delete(companies).where(ilike(companies.name, "%CI Contact Co%"));

    const hashedPassword = await hashPassword(TEST_PASSWORD);
    const [inserted] = await db
      .insert(users)
      .values({ email: TEST_EMAIL, password_hash: hashedPassword, name: "Contact Test" })
      .returning({ id: users.id });

    testUserId = inserted.id;
    testToken = generateAccessToken(testUserId);
    await db.insert(userProfiles).values({ user_id: testUserId });

    const [company] = await db
      .insert(companies)
      .values({ name: "CI Contact Co", normalized_name: "ci contact co" })
      .returning();
    testCompanyId = company.id;
  });

  afterAll(async () => {
    await db.delete(users).where(eq(users.email, TEST_EMAIL));
    await db.delete(companies).where(ilike(companies.name, "%CI Contact Co%"));
  });

  // ── POST /contacts ─────────────────────────────────────
  describe("POST /contacts", () => {
    it("creates (201)", async () => {
      const res = await request(app)
        .post("/contacts")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ name: "John Doe", role: "Recruiter" });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("John Doe");
      expect(res.body.user_id).toBe(testUserId);
    });

    it("creates linked to company", async () => {
      const res = await request(app)
        .post("/contacts")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ name: "Jane Smith", company_id: testCompanyId });

      expect(res.status).toBe(201);
      expect(res.body.company_id).toBe(testCompanyId);
    });

    it("rejects missing name (400)", async () => {
      const res = await request(app)
        .post("/contacts")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ role: "Engineer" });

      expect(res.status).toBe(400);
    });
  });

  // ── GET /contacts ──────────────────────────────────────
  describe("GET /contacts", () => {
    it("lists (user-scoped)", async () => {
      const res = await request(app)
        .get("/contacts")
        .set("Authorization", `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it("filters by company_id", async () => {
      const res = await request(app)
        .get(`/contacts?company_id=${testCompanyId}`)
        .set("Authorization", `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      for (const c of res.body) {
        expect(c.company_id).toBe(testCompanyId);
      }
    });
  });

  // ── GET /contacts/:id ──────────────────────────────────
  describe("GET /contacts/:id", () => {
    let contactId: number;

    beforeAll(async () => {
      const res = await request(app)
        .post("/contacts")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ name: "CI GetById Contact", company_id: testCompanyId });
      contactId = res.body.id;
    });

    it("returns with company_name", async () => {
      const res = await request(app)
        .get(`/contacts/${contactId}`)
        .set("Authorization", `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(contactId);
      expect(res.body.company_name).toBe("CI Contact Co");
    });

    it("returns 404 for nonexistent", async () => {
      const res = await request(app)
        .get("/contacts/999999")
        .set("Authorization", `Bearer ${testToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ── PUT /contacts/:id ──────────────────────────────────
  describe("PUT /contacts/:id", () => {
    let contactId: number;

    beforeAll(async () => {
      const res = await request(app)
        .post("/contacts")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ name: "CI Update Contact" });
      contactId = res.body.id;
    });

    it("updates fields", async () => {
      const res = await request(app)
        .put(`/contacts/${contactId}`)
        .set("Authorization", `Bearer ${testToken}`)
        .send({ name: "CI Updated Contact", role: "Manager" });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("CI Updated Contact");
      expect(res.body.role).toBe("Manager");
    });
  });

  // ── DELETE /contacts/:id ───────────────────────────────
  describe("DELETE /contacts/:id", () => {
    it("deletes (204)", async () => {
      const createRes = await request(app)
        .post("/contacts")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ name: "CI Delete Contact" });

      const res = await request(app)
        .delete(`/contacts/${createRes.body.id}`)
        .set("Authorization", `Bearer ${testToken}`);

      expect(res.status).toBe(204);
    });

    it("returns 404 for nonexistent", async () => {
      const res = await request(app)
        .delete("/contacts/999999")
        .set("Authorization", `Bearer ${testToken}`);

      expect(res.status).toBe(404);
    });
  });
});
