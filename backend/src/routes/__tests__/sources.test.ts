import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../app.js";
import { db } from "../../db/index.js";
import { users, userProfiles, sources, userSourceNotes } from "../../db/schema.js";
import { eq, ilike } from "drizzle-orm";
import { generateAccessToken, hashPassword } from "../../utils/auth.js";

const TEST_EMAIL = "source-test@ci.example.com";
const TEST_PASSWORD = "test-password-123";

describe("Source Routes", () => {
  let testUserId: number;
  let testToken: string;

  beforeAll(async () => {
    await db.delete(users).where(eq(users.email, TEST_EMAIL));
    // Hard-delete test sources
    await db.delete(sources).where(ilike(sources.name, "%CI Test Src%"));

    const hashedPassword = await hashPassword(TEST_PASSWORD);
    const [inserted] = await db
      .insert(users)
      .values({ email: TEST_EMAIL, password_hash: hashedPassword, name: "Source Test" })
      .returning({ id: users.id });

    testUserId = inserted.id;
    testToken = generateAccessToken(testUserId);
    await db.insert(userProfiles).values({ user_id: testUserId });
  });

  afterAll(async () => {
    await db.delete(users).where(eq(users.email, TEST_EMAIL));
    await db.delete(sources).where(ilike(sources.name, "%CI Test Src%"));
  });

  // ── POST /sources ──────────────────────────────────────
  describe("POST /sources", () => {
    it("creates with normalized_name (201)", async () => {
      const res = await request(app)
        .post("/sources")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ name: "CI Test Src Alpha", category: "job_board" });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("CI Test Src Alpha");
      expect(res.body.normalized_name).toBeDefined();
    });

    it("rejects duplicate (409)", async () => {
      const res = await request(app)
        .post("/sources")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ name: "ci test src alpha" });

      expect(res.status).toBe(409);
    });

    it("rejects missing name (400)", async () => {
      const res = await request(app)
        .post("/sources")
        .set("Authorization", `Bearer ${testToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it("accepts valid category", async () => {
      const res = await request(app)
        .post("/sources")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ name: "CI Test Src Cat", category: "recruiter" });

      expect(res.status).toBe(201);
      expect(res.body.category).toBe("recruiter");
    });

    it("rejects invalid category (400)", async () => {
      const res = await request(app)
        .post("/sources")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ name: "CI Test Src BadCat", category: "invalid_cat" });

      expect(res.status).toBe(400);
    });
  });

  // ── POST /sources/find-or-create ───────────────────────
  describe("POST /sources/find-or-create", () => {
    it("returns existing when normalized match", async () => {
      const res = await request(app)
        .post("/sources/find-or-create")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ name: "CI Test Src Alpha" });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("CI Test Src Alpha");
    });

    it("creates new when novel", async () => {
      const res = await request(app)
        .post("/sources/find-or-create")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ name: "CI Test Src Novel" });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("CI Test Src Novel");
    });
  });

  // ── GET /sources ───────────────────────────────────────
  describe("GET /sources", () => {
    it("lists only active", async () => {
      const res = await request(app)
        .get("/sources")
        .set("Authorization", `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      for (const s of res.body) {
        expect(s.is_active).toBe(true);
      }
    });
  });

  // ── GET /sources/search ────────────────────────────────
  describe("GET /sources/search", () => {
    it("partial name (case-insensitive)", async () => {
      const res = await request(app)
        .get("/sources/search?q=CI Test Src")
        .set("Authorization", `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  // ── DELETE /sources/:id ────────────────────────────────
  describe("DELETE /sources/:id", () => {
    let sourceId: number;

    beforeAll(async () => {
      const res = await request(app)
        .post("/sources")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ name: "CI Test Src Del" });
      sourceId = res.body.id;
    });

    it("soft-deletes (is_active=false)", async () => {
      const res = await request(app)
        .delete(`/sources/${sourceId}`)
        .set("Authorization", `Bearer ${testToken}`);

      expect(res.status).toBe(204);
    });

    it("no longer in active list", async () => {
      const res = await request(app)
        .get("/sources")
        .set("Authorization", `Bearer ${testToken}`);

      const deleted = res.body.find((s: any) => s.id === sourceId);
      expect(deleted).toBeUndefined();
    });
  });

  // ── PUT /sources/:id ───────────────────────────────────
  describe("PUT /sources/:id", () => {
    let sourceId: number;

    beforeAll(async () => {
      const res = await request(app)
        .post("/sources")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ name: "CI Test Src Upd" });
      sourceId = res.body.id;
    });

    it("updates fields", async () => {
      const res = await request(app)
        .put(`/sources/${sourceId}`)
        .set("Authorization", `Bearer ${testToken}`)
        .send({ region: "EU" });

      expect(res.status).toBe(200);
      expect(res.body.region).toBe("EU");
    });

    it("rejects name conflict (409)", async () => {
      const res = await request(app)
        .put(`/sources/${sourceId}`)
        .set("Authorization", `Bearer ${testToken}`)
        .send({ name: "CI Test Src Alpha" });

      expect(res.status).toBe(409);
    });
  });

  // ── User Notes ─────────────────────────────────────────
  describe("Source Notes", () => {
    let sourceId: number;

    beforeAll(async () => {
      const res = await request(app)
        .post("/sources")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ name: "CI Test Src Notes" });
      sourceId = res.body.id;
    });

    it("PUT creates notes (upsert)", async () => {
      const res = await request(app)
        .put(`/sources/${sourceId}/notes`)
        .set("Authorization", `Bearer ${testToken}`)
        .send({ notes: "Good source", rating: 4 });

      expect(res.status).toBe(200);
      expect(res.body.notes).toBe("Good source");
    });

    it("PUT updates existing notes", async () => {
      const res = await request(app)
        .put(`/sources/${sourceId}/notes`)
        .set("Authorization", `Bearer ${testToken}`)
        .send({ notes: "Updated source notes", rating: 5 });

      expect(res.status).toBe(200);
      expect(res.body.notes).toBe("Updated source notes");
    });

    it("DELETE deletes notes (204)", async () => {
      const res = await request(app)
        .delete(`/sources/${sourceId}/notes`)
        .set("Authorization", `Bearer ${testToken}`);

      expect(res.status).toBe(204);
    });
  });
});
