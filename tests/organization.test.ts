import { createTestServer } from "@cloudflare/vitest-pool-workers";
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import organization from "../src/api/organization";

const prisma = new PrismaClient();

let testUser: any, orgId: string;

beforeAll(async () => {
  // Create a test user
  testUser = await prisma.user.create({
    data: { email: "orgtest@test.com", password: "testpass123" },
  });
});

afterAll(async () => {
  await prisma.invite.deleteMany({});
  await prisma.userOrganization.deleteMany({ where: { userId: testUser.id } });
  await prisma.organization.deleteMany({
    where: { name: { contains: "TestOrg" } },
  });
  await prisma.user.deleteMany({ where: { email: { contains: "@test.com" } } });
  await prisma.$disconnect();
});

describe("Organization API", () => {
  const server = createTestServer(organization);

  it("creates a new organization", async () => {
    const res = await server.fetch("/", {
      method: "POST",
      body: JSON.stringify({ userId: testUser.id, name: "TestOrg1" }),
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.token).toBeDefined();
    // Save orgId for later tests
    const org = await prisma.organization.findFirst({
      where: { name: "TestOrg1" },
    });
    orgId = org?.id;
  });

  it("prevents duplicate organization name", async () => {
    await prisma.organization.create({ data: { name: "TestOrg2" } });
    const res = await server.fetch("/", {
      method: "POST",
      body: JSON.stringify({ userId: testUser.id, name: "TestOrg2" }),
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.ok).toBe(false);
  });

  it("invites a user to an organization", async () => {
    const res = await server.fetch(`/invite?organizationId=${orgId}`, {
      method: "POST",
      body: JSON.stringify({
        userId: testUser.id,
        invites: ["invitee@test.com"],
      }),
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.message).toMatch(/invites sent/i);
  });

  it("validates an invite token", async () => {
    // Create an invite directly
    const invite = await prisma.invite.create({
      data: {
        email: "invitee2@test.com",
        organizationId: orgId,
        invitedById: testUser.id,
        token: "test-token-123",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    const res = await server.fetch(`/validate-invite/${invite.token}`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.message).toMatch(/valid/i);
  });

  it("accepts an invite for a registered user", async () => {
    // Create a user and invite
    const invitedUser = await prisma.user.create({
      data: { email: "acceptme@test.com", password: "x" },
    });
    const invite = await prisma.invite.create({
      data: {
        email: "acceptme@test.com",
        organizationId: orgId,
        invitedById: testUser.id,
        token: "accept-token-123",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    const res = await server.fetch(`/accept-invite/${invite.token}`, {
      method: "POST",
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.token).toBeDefined();
  });

  it("returns register-first for unregistered invitee", async () => {
    const invite = await prisma.invite.create({
      data: {
        email: "notregistered@test.com",
        organizationId: orgId,
        invitedById: testUser.id,
        token: "register-token-123",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    const res = await server.fetch(`/accept-invite/${invite.token}`, {
      method: "POST",
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.type).toBe("register-user-first");
  });
});
