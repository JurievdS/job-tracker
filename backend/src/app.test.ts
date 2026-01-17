import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "./app.js";

describe("API", () => {
  it("should return API status on root", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Job Tracker API");
  });

  it("should return companies list", async () => {
    const res = await request(app).get("/companies");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("should return dashboard stats", async () => {
    const res = await request(app).get("/dashboard");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("stats");
    expect(res.body).toHaveProperty("recent_activity");
  });

  it("should return 404 for non-existent company", async () => {
    const res = await request(app).get("/companies/99999");
    expect(res.status).toBe(404);
  });
});