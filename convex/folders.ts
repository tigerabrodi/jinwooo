import { v } from 'convex/values'
import { Id } from './_generated/dataModel'
import { mutation, query } from './_generated/server'
import { requireCurrentUser } from './users'

export const createFolder = mutation({
  args: {
    name: v.string(),
    parentId: v.union(v.id('folders'), v.null()),
    depth: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx)

    const folder = await ctx.db.insert('folders', {
      name: args.name,
      updatedAt: Date.now(),
      depth: args.depth,
      isInitial: false,
      noteCount: 0,
      // can be null if root level
      parentId: args.parentId,
      userId: user._id,
    })

    return folder
  },
})

export const allFolders = query({
  handler: async (ctx) => {
    const user = await requireCurrentUser(ctx)

    return await ctx.db
      .query('folders')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .collect()
  },
})

export const updateFolder = mutation({
  args: {
    id: v.id('folders'),
    data: v.object({
      name: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { ...args.data, updatedAt: Date.now() })
  },
})

export const deleteFolder = mutation({
  args: { id: v.id('folders') },
  handler: async (ctx, args) => {
    const folderIds = new Set<Id<'folders'>>()
    const noteIds = new Set<Id<'notes'>>()

    async function collectFolderAndNotes(folderId: Id<'folders'>) {
      folderIds.add(folderId)

      // Get notes in this folder
      const notes = await ctx.db
        .query('notes')
        .withIndex('by_folderId', (q) => q.eq('folderId', folderId))
        .collect()

      notes.forEach((note) => noteIds.add(note._id))

      // Get subfolders
      const subfolders = await ctx.db
        .query('folders')
        .filter((q) => q.eq(q.field('parentId'), folderId))
        .collect()

      // Recursively process each subfolder
      await Promise.all(
        subfolders.map((subfolder) => collectFolderAndNotes(subfolder._id))
      )
    }

    // Start collection from the target folder
    await collectFolderAndNotes(args.id)

    // Delete all collected notes and folders
    await Promise.all([
      ...Array.from(noteIds).map((noteId) => ctx.db.delete(noteId)),
      ...Array.from(folderIds).map((folderId) => ctx.db.delete(folderId)),
    ])
  },
})
