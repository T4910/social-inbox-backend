// Mock data for the task management application

export type User = {
    name: string
    email: string
    password: string
  }
  
  export type Task = {
    id: string
    title: string
    description: string
    status: "todo" | "in-progress" | "review" | "done"
    priority: "low" | "medium" | "high"
    assigneeId: string | null
    createdById: string
    createdAt: string
    dueDate: string | null
    tags: string[]
    comments: Comment[]
  }
  
  export type Comment = {
    id: string
    taskId: string
    userId: string
    content: string
    createdAt: string
  }
  
  export type Project = {
    id: string
    name: string
    description: string
    ownerId: string
    members: string[] // User IDs
    createdAt: string
  }
  
  export type Role = {
    id: string
    name: string
    description: string
    permissions: Permission[]
  }
  
  export type Permission = {
    resource: "tasks" | "projects" | "users" | "roles"
    action: "create" | "read" | "update" | "delete"
  }
  
  // Mock users
  export const users: User[] = [
    {
      name: "Viewer User",
      email: "viewer@example.com",
      password: "password123",
    },
    {
      name: "Sarah Johnson",
      email: "sarah@example.com",
      password: "password123",
    },
    {
      name: "Michael Chen",
      email: "michael@example.com",
      password: "password123",
    },
  ]
  
  // Mock tasks
  export const tasks: Task[] = [
    {
      id: "task-1",
      title: "Design new dashboard layout",
      description: "Create wireframes and mockups for the new dashboard layout",
      status: "todo",
      priority: "high",
      assigneeId: "user-2",
      createdById: "user-1",
      createdAt: "2023-04-01T10:00:00Z",
      dueDate: "2023-04-10T17:00:00Z",
      tags: ["design", "ui/ux"],
      comments: [
        {
          id: "comment-1",
          taskId: "task-1",
          userId: "user-1",
          content: "Please focus on mobile responsiveness",
          createdAt: "2023-04-02T09:30:00Z",
        },
      ],
    },
    {
      id: "task-2",
      title: "Implement authentication system",
      description: "Set up user authentication with JWT and role-based access control",
      status: "in-progress",
      priority: "high",
      assigneeId: "user-4",
      createdById: "user-1",
      createdAt: "2023-04-02T11:00:00Z",
      dueDate: "2023-04-12T17:00:00Z",
      tags: ["backend", "security"],
      comments: [],
    },
    {
      id: "task-3",
      title: "Create API documentation",
      description: "Document all API endpoints with examples and response schemas",
      status: "todo",
      priority: "medium",
      assigneeId: "user-5",
      createdById: "user-1",
      createdAt: "2023-04-03T09:00:00Z",
      dueDate: "2023-04-15T17:00:00Z",
      tags: ["documentation", "api"],
      comments: [],
    },
    {
      id: "task-4",
      title: "Fix pagination bug in task list",
      description: "The pagination in the task list is not working correctly when filtering by status",
      status: "review",
      priority: "medium",
      assigneeId: "user-2",
      createdById: "user-4",
      createdAt: "2023-04-04T14:00:00Z",
      dueDate: "2023-04-08T17:00:00Z",
      tags: ["bug", "frontend"],
      comments: [
        {
          id: "comment-2",
          taskId: "task-4",
          userId: "user-2",
          content: "I've identified the issue. It's related to the filter state not being reset when changing pages.",
          createdAt: "2023-04-05T10:15:00Z",
        },
      ],
    },
    {
      id: "task-5",
      title: "Optimize database queries",
      description: "Improve performance of dashboard queries by adding indexes and optimizing joins",
      status: "done",
      priority: "high",
      assigneeId: "user-5",
      createdById: "user-1",
      createdAt: "2023-04-01T15:30:00Z",
      dueDate: "2023-04-07T17:00:00Z",
      tags: ["performance", "database"],
      comments: [
        {
          id: "comment-3",
          taskId: "task-5",
          userId: "user-5",
          content: "Added indexes to the most frequently queried columns. Performance improved by 40%.",
          createdAt: "2023-04-06T16:45:00Z",
        },
        {
          id: "comment-4",
          taskId: "task-5",
          userId: "user-1",
          content: "Great work! Let's monitor the performance over the next few days.",
          createdAt: "2023-04-06T17:30:00Z",
        },
      ],
    },
    {
      id: "task-6",
      title: "Create onboarding tutorial",
      description: "Design and implement an interactive onboarding tutorial for new users",
      status: "todo",
      priority: "low",
      assigneeId: null,
      createdById: "user-4",
      createdAt: "2023-04-05T11:00:00Z",
      dueDate: "2023-04-20T17:00:00Z",
      tags: ["ux", "onboarding"],
      comments: [],
    },
    {
      id: "task-7",
      title: "Update privacy policy",
      description: "Review and update the privacy policy to comply with new regulations",
      status: "in-progress",
      priority: "medium",
      assigneeId: "user-1",
      createdById: "user-1",
      createdAt: "2023-04-06T09:15:00Z",
      dueDate: "2023-04-13T17:00:00Z",
      tags: ["legal", "compliance"],
      comments: [],
    },
    {
      id: "task-8",
      title: "Implement dark mode",
      description: "Add dark mode support to the application",
      status: "review",
      priority: "low",
      assigneeId: "user-2",
      createdById: "user-2",
      createdAt: "2023-04-03T13:45:00Z",
      dueDate: "2023-04-11T17:00:00Z",
      tags: ["ui", "feature"],
      comments: [
        {
          id: "comment-5",
          taskId: "task-8",
          userId: "user-2",
          content: "Dark mode implementation is complete. Please review the color scheme.",
          createdAt: "2023-04-07T15:20:00Z",
        },
      ],
    },
  ]
  
  // Mock projects
  export const projects: Project[] = [
    {
      id: "project-1",
      name: "Website Redesign",
      description: "Complete overhaul of the company website with new branding",
      ownerId: "user-1",
      members: ["user-1", "user-2", "user-4"],
      createdAt: "2023-03-15T09:00:00Z",
    },
    {
      id: "project-2",
      name: "Mobile App Development",
      description: "Develop a new mobile app for iOS and Android",
      ownerId: "user-1",
      members: ["user-1", "user-4", "user-5"],
      createdAt: "2023-03-20T14:30:00Z",
    },
    {
      id: "project-3",
      name: "Internal Tools",
      description: "Build internal tools for improving team productivity",
      ownerId: "user-4",
      members: ["user-1", "user-2", "user-3", "user-4", "user-5"],
      createdAt: "2023-03-25T11:15:00Z",
    },
  ]
  
  // Mock roles with permissions
  export const roles: Role[] = [
    {
      id: "role-1",
      name: "Administrator",
      description: "Full access to all resources",
      permissions: [
        { resource: "tasks", action: "create" },
        { resource: "tasks", action: "read" },
        { resource: "tasks", action: "update" },
        { resource: "tasks", action: "delete" },
        { resource: "projects", action: "create" },
        { resource: "projects", action: "read" },
        { resource: "projects", action: "update" },
        { resource: "projects", action: "delete" },
        { resource: "users", action: "create" },
        { resource: "users", action: "read" },
        { resource: "users", action: "update" },
        { resource: "users", action: "delete" },
        { resource: "roles", action: "create" },
        { resource: "roles", action: "read" },
        { resource: "roles", action: "update" },
        { resource: "roles", action: "delete" },
      ],
    },
    {
      id: "role-2",
      name: "Editor",
      description: "Can create and edit tasks and projects",
      permissions: [
        { resource: "tasks", action: "create" },
        { resource: "tasks", action: "read" },
        { resource: "tasks", action: "update" },
        { resource: "projects", action: "read" },
        { resource: "projects", action: "update" },
        { resource: "users", action: "read" },
      ],
    },
    {
      id: "role-3",
      name: "Viewer",
      description: "Read-only access to tasks and projects",
      permissions: [
        { resource: "tasks", action: "read" },
        { resource: "projects", action: "read" },
        { resource: "users", action: "read" },
      ],
    },
  ]
  
  // Helper function to get user by ID
//   export function getUserById(id: string): User | undefined {
//     return users.find((user) => user.id === id)
//   }
  
//   // Helper function to get tasks by assignee ID
//   export function getTasksByAssigneeId(assigneeId: string): Task[] {
//     return tasks.filter((task) => task.assigneeId === assigneeId)
//   }
  
//   // Helper function to get tasks by creator ID
//   export function getTasksByCreatorId(creatorId: string): Task[] {
//     return tasks.filter((task) => task.createdById === creatorId)
//   }
  
//   // Helper function to get projects by member ID
//   export function getProjectsByMemberId(memberId: string): Project[] {
//     return projects.filter((project) => project.members.includes(memberId))
//   }
  
//   // Helper function to check if a user has a specific permission
//   export function hasPermission(userId: string, resource: Permission["resource"], action: Permission["action"]): boolean {
//     const user = getUserById(userId)
//     if (!user) return false
  
//     const userRole = roles.find((role) => role.name.toLowerCase() === user.role)
//     if (!userRole) return false
  
//     return userRole.permissions.some((permission) => permission.resource === resource && permission.action === action)
//   }
  