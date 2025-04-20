import { createTestServer } from "@cloudflare/vitest-pool-workers";
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { tasks } from "../src/api/task";

const prisma = new PrismaClient();

let org: any, user: any, taskId: string;

beforeAll(async () => {
  org = await prisma.organization.create({ data: { name: "TasksTestOrg" } });
  user = await prisma.user.create({
    data: { email: "taskuser@test.com", password: "testpass123" },
  });
});

afterAll(async () => {
  await prisma.taskComment.deleteMany({});
  await prisma.task.deleteMany({ where: { organizationId: org.id } });
  await prisma.user.deleteMany({ where: { id: user.id } });
  await prisma.organization.deleteMany({ where: { id: org.id } });
  await prisma.$disconnect();
});

describe("Tasks API", () => {
  const server = createTestServer(tasks);

  it("creates a new task", async () => {
    const res = await server.fetch("/", {
      method: "POST",
      body: JSON.stringify({
        title: "Test Task",
        description: "A test task",
        status: "PENDING",
        priority: "LOW",
        createdById: user.id,
        organizationId: org.id,
      }),
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.title).toBe("Test Task");
    taskId = data.data.id;
  });

  it("fetches all tasks for an organization", async () => {
    const res = await server.fetch(`/?organizationId=${org.id}`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  it("fetches a single task by ID", async () => {
    const res = await server.fetch(`/${taskId}?organizationId=${org.id}`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.id).toBe(taskId);
  });

  it("updates a task", async () => {
    const res = await server.fetch(`/${taskId}`, {
      method: "PUT",
      body: JSON.stringify({
        id: taskId,
        title: "Updated Task",
        status: "IN_PROGRESS",
        priority: "HIGH",
        createdById: user.id,
        organizationId: org.id,
      }),
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.title).toBe("Updated Task");
    expect(data.data.status).toBe("IN_PROGRESS");
  });

  it("deletes a task", async () => {
    // Create a new task to delete
    const newTask = await prisma.task.create({
      data: {
        title: "Delete Me",
        status: "PENDING",
        priority: "LOW",
        createdById: user.id,
        organizationId: org.id,
      },
    });
    const res = await server.fetch(`/${newTask.id}?organizationId=${org.id}`, {
      method: "DELETE",
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("adds a comment to a task", async () => {
    const res = await server.fetch(`/${taskId}/comments`, {
      method: "POST",
      body: JSON.stringify({ userId: user.id, content: "Nice work!" }),
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.content).toBe("Nice work!");
  });

  it("fetches all comments for a task", async () => {
    const res = await server.fetch(`/${taskId}/comments`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data[0].content).toBe("Nice work!");
  });

  it("deletes a comment from a task", async () => {
    // Add a comment to delete
    const comment = await prisma.taskComment.create({
      data: { taskId, userId: user.id, content: "Delete this comment" },
    });
    const res = await server.fetch(`/${taskId}/comments/${comment.id}`, {
      method: "DELETE",
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.message).toMatch(/delete/i);
  });
});
