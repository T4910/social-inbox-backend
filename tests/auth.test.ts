import { createTestServer } from "@cloudflare/vitest-pool-workers";
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import auth from "../src/api/auth";

const prisma = new PrismaClient();

// Utility to clear test data
afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: "@test.com" } } });
  await prisma.$disconnect();
});

describe("Auth API", () => {
  const server = createTestServer(auth);

  it("registers a new user", async () => {
    const res = await server.fetch("/register", {
      method: "POST",
      body: JSON.stringify({
        email: "user1@test.com",
        password: "testpass123",
      }),
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.userId).toBeDefined();
  });

  it("prevents duplicate registration", async () => {
    await prisma.user.create({
      data: { email: "dupe@test.com", password: "x" },
    });
    const res = await server.fetch("/register", {
      method: "POST",
      body: JSON.stringify({ email: "dupe@test.com", password: "x" }),
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.ok).toBe(false);
  });

  it("logs in a user and returns a token", async () => {
    await prisma.user.create({
      data: { email: "login@test.com", password: "testpass123" },
    });
    const res = await server.fetch("/login", {
      method: "POST",
      body: JSON.stringify({
        email: "login@test.com",
        password: "testpass123",
      }),
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.token).toBeDefined();
  });

  // Add more tests for /me, /checkPermissions, /switch-organization, /google as needed
  it("checks user permissions", async () => {
    // Assume you have a valid token for a user in an org
    const token = "your-jwt-token";
    const res = await server.fetch("/checkPermissions", {
      method: "POST",
      body: JSON.stringify({
        token,
        actions: ["read"],
        resources: ["tasks"],
      }),
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data).toBe(true); // or false if not permitted
  });
});
