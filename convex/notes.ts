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

    const preview = args.content.slice(0, 100)

    const note = await ctx.db.insert('notes', {
      title: args.title,
      content: args.content,
      preview,
      updatedAt: Date.now(),
      folderId: args.folderId,
      userId: user._id,
    })

    const folder = await ctx.db.get(args.folderId)

    if (!folder) throw new Error('Folder not found')

    await ctx.db.patch(args.folderId, {
      noteCount: folder.noteCount + 1,
    })

    return note
  },
})

export const getNotesByFolderId = query({
  args: {
    folderId: v.id('folders'),
  },
  handler: async (ctx, args) => {
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
    const note = await ctx.db.get(args.noteId)
    const folder = await ctx.db.get(args.folderId)

    if (!note || !folder) {
      throw new Error('Note or folder not found')
    }

    await ctx.db.patch(args.folderId, {
      noteCount: folder.noteCount - 1,
    })

    return await ctx.db.delete(args.noteId)
  },
})
