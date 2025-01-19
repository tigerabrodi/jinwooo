import { v } from 'convex/values'
import { mutation } from './_generated/server'
import { requireCurrentUser } from './users'

export const createFolder = mutation({
  args: {
    name: v.string(),
    parentId: v.union(v.id('folders'), v.null()),
    depth: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx)

    console.log('user', user)

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

    console.log('folder', folder)

    return folder
  },
})
