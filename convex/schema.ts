import { authTables } from '@convex-dev/auth/server'
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  ...authTables,

  users: defineTable({
    email: v.string(),
    updatedAt: v.number(),
    initialFolderId: v.union(v.id('folders'), v.null()),
  }).index('by_email', ['email']),

  folders: defineTable({
    name: v.string(),
    depth: v.number(),
    isInitial: v.boolean(),
    noteCount: v.number(),
    updatedAt: v.number(),
    parentId: v.union(v.id('folders'), v.null()),
    userId: v.id('users'),
  }).index('by_userId', ['userId']),

  notes: defineTable({
    title: v.string(),
    content: v.string(),
    preview: v.optional(v.string()),
    updatedAt: v.number(),
    folderId: v.id('folders'),
    userId: v.id('users'),
  }).index('by_folderId', ['folderId']),
})
