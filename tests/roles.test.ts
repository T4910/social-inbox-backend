import { createTestServer } from "@cloudflare/vitest-pool-workers";
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { roles } from "../src/api/roles";

const prisma = new PrismaClient();

let org: any, roleId: string;

beforeAll(async () => {
  org = await prisma.organization.create({ data: { name: "RolesTestOrg" } });
});

afterAll(async () => {
  await prisma.roles.deleteMany({ where: { organizationId: org.id } });
  await prisma.organization.deleteMany({ where: { id: org.id } });
  await prisma.$disconnect();
});

describe("Roles API", () => {
  const server = createTestServer(roles);

  it("creates a new role", async () => {
    const res = await server.fetch("/", {
      method: "POST",
      body: JSON.stringify({
        name: "testrole",
        description: "desc",
        organizationId: org.id,
        permissions: [
          { resource: "tasks", action: "read" },
          { resource: "users", action: "update" },
        ],
      }),
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.name).toBe("testrole");
    expect(data.data.permissions.length).toBe(2);
    roleId = data.data.id;
  });

  it("fetches all roles for an organization", async () => {
    const res = await server.fetch(`/?organizationId=${org.id}`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.some((r: any) => r.id === roleId)).toBe(true);
  });

  it("updates a role", async () => {
    const res = await server.fetch(`/${roleId}`, {
      method: "PUT",
      body: JSON.stringify({
        id: roleId,
        name: "updatedrole",
        organizationId: org.id,
        permissions: [
          { resource: "tasks", action: "read" },
          { resource: "tasks", action: "update" },
        ],
      }),
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.name).toBe("updatedrole");
    expect(data.data.permissions.some((p: any) => p.action === "update")).toBe(
      true
    );
  });

  it("deletes a role", async () => {
    // Create a new role to delete
    const newRole = await prisma.roles.create({
      data: {
        name: "deleteme",
        description: "desc",
        organizationId: org.id,
        permissions: {
          create: [{ resource: "tasks", action: "read" }],
        },
      },
    });
    const res = await server.fetch(`/${newRole.id}?organizationId=${org.id}`, {
      method: "DELETE",
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.message).toMatch(/deleted/i);
  });
});
