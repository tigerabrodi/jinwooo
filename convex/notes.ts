import { v } from 'convex/values'
import { mutation } from './_generated/server'
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

    if (!folder) {
      throw new Error('Folder not found')
    }

    await ctx.db.patch(args.folderId, {
      noteCount: folder.noteCount + 1,
    })

    return note
  },
})
