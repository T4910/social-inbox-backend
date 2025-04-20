import { createTestServer } from "@cloudflare/vitest-pool-workers";
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import users from "../src/api/users";

const prisma = new PrismaClient();

let org: any, role: any, testUser: any;

beforeAll(async () => {
  org = await prisma.organization.create({ data: { name: "UsersTestOrg" } });
  role = await prisma.roles.create({
    data: { name: "testrole", description: "desc", organizationId: org.id },
  });
  testUser = await prisma.user.create({
    data: { email: "usertest@test.com", password: "testpass123" },
  });
  await prisma.userOrganization.create({
    data: { userId: testUser.id, organizationId: org.id, roleId: role.id },
  });
});

afterAll(async () => {
  await prisma.userOrganization.deleteMany({
    where: { organizationId: org.id },
  });
  await prisma.user.deleteMany({ where: { id: testUser.id } });
  await prisma.roles.deleteMany({ where: { organizationId: org.id } });
  await prisma.organization.deleteMany({ where: { id: org.id } });
  await prisma.$disconnect();
});

describe("Users API", () => {
  const server = createTestServer(users);

  it("fetches all users in an organization", async () => {
    const res = await server.fetch(`/?organizationId=${org.id}`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data[0].email).toBe("usertest@test.com");
  });

  it("fetches a user by ID in an organization", async () => {
    const res = await server.fetch(`/${testUser.id}?organizationId=${org.id}`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.email).toBe("usertest@test.com");
  });

  it("updates a user's email in an organization", async () => {
    const res = await server.fetch(`/${testUser.id}?organizationId=${org.id}`, {
      method: "PUT",
      body: JSON.stringify({
        user: { email: "updateduser@test.com" },
        role: { id: role.id }
      }),
      headers: { "Content-Type": "application/json" }
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.email).toBe("updateduser@test.com");
  });

  it("removes a user from an organization", async () => {
    // Add user back to org for this test
    await prisma.userOrganization.create({ data: { userId: testUser.id, organizationId: org.id, roleId: role.id } });
    const res = await server.fetch(`/${testUser.id}?organizationId=${org.id}`, {
      method: "DELETE"
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.message).toMatch(/removed/i);
  });
});
