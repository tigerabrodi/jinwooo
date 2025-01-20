import { Password } from '@convex-dev/auth/providers/Password'
import { convexAuth } from '@convex-dev/auth/server'
import { DataModel } from './_generated/dataModel'
import { MutationCtx } from './_generated/server'

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password<DataModel>()],
  callbacks: {
    async createOrUpdateUser(ctx: MutationCtx, args) {
      if (args.existingUserId) {
        return args.existingUserId
      }

      // First create the user
      const userId = await ctx.db.insert('users', {
        email: args.profile.email || '',
        updatedAt: Date.now(),
        initialFolderId: null,
      })

      // Then create the initial folder directly with ctx.db
      const initialFolderId = await ctx.db.insert('folders', {
        name: 'All Notes',
        depth: 0,
        isInitial: true,
        noteCount: 1,
        parentId: null,
        userId: userId, // We can use the userId directly
        updatedAt: Date.now(),
      })

      // Create welcome note directly
      await ctx.db.insert('notes', {
        title: 'Welcome to Jinwoo!',
        content: 'Jinwoo is a fun lil note taking app.',
        preview: 'Jinwoo is a fun lil note taking app.',
        folderId: initialFolderId,
        userId: userId,
        updatedAt: Date.now(),
      })

      // Update user with the folder
      await ctx.db.patch(userId, {
        initialFolderId: initialFolderId,
      })

      return userId
    },
  },
})
