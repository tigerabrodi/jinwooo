import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireCurrentUser } from './users'

export const createNote = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    folderId: v.id('folders'),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx)
    if (!user.initialFolderId) {
      throw new Error('User has no initial folder')
    }

    // Get both folders concurrently
    const [folder, initialFolder] = await Promise.all([
      ctx.db.get(args.folderId),
      ctx.db.get(user.initialFolderId),
    ])

    if (!folder || !initialFolder) {
      throw new Error('Folder or initial folder not found')
    }

    const preview = args.content.slice(0, 100)

    // Create the note
    const note = await ctx.db.insert('notes', {
      title: args.title,
      content: args.content,
      preview,
      updatedAt: Date.now(),
      folderId: args.folderId,
      userId: user._id,
    })

    // Determine which folders need their count incremented
    const foldersToUpdate = folder.isInitial
      ? [folder]
      : [folder, initialFolder]

    // Update all folder counts at once
    await Promise.all(
      foldersToUpdate.map((folder) =>
        ctx.db.patch(folder._id, {
          noteCount: folder.noteCount + 1,
        })
      )
    )

    return note
  },
})

export const getNotesByFolderId = query({
  args: {
    folderId: v.id('folders'),
  },
  handler: async (ctx, args) => {
    const folder = await ctx.db.get(args.folderId)

    if (!folder) return []

    // if initial, return all notes
    if (folder.isInitial) {
      return await ctx.db.query('notes').collect()
    }

    return await ctx.db
      .query('notes')
      .withIndex('by_folderId', (q) => q.eq('folderId', args.folderId))
      .collect()
  },
})

export const deleteNote = mutation({
  args: {
    noteId: v.id('notes'),
    folderId: v.id('folders'),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx)
    if (!user.initialFolderId) {
      throw new Error('User has no initial folder')
    }

    const [note, folder, initialFolder] = await Promise.all([
      ctx.db.get(args.noteId),
      ctx.db.get(args.folderId),
      ctx.db.get(user.initialFolderId),
    ])

    if (!note || !folder || !initialFolder) {
      throw new Error('Note or folder or initial folder not found')
    }

    const foldersToUpdate = folder.isInitial
      ? [folder]
      : [folder, initialFolder]

    // Update all folder counts at once
    await Promise.all(
      foldersToUpdate.map((folder) =>
        ctx.db.patch(folder._id, {
          noteCount: folder.noteCount - 1,
        })
      )
    )

    return await ctx.db.delete(args.noteId)
  },
})

export const getNoteById = query({
  args: {
    id: v.optional(v.id('notes')),
  },
  handler: async (ctx, { id }) => {
    if (!id) return null

    return await ctx.db.get(id)
  },
})

export const updateNote = mutation({
  args: {
    id: v.id('notes'),
    data: v.object({
      title: v.optional(v.string()),
      content: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, args.data)
  },
})
