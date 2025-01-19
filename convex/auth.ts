import { Password } from '@convex-dev/auth/providers/Password'
import { convexAuth } from '@convex-dev/auth/server'

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      if (args.existingUserId) {
        return args.existingUserId
      }

      // First create the user
      const userId = await ctx.db.insert('users', {
        email: args.profile.email,
        image: args.profile.image,
        updatedAt: Date.now(),
        initialFolderId: null,
      })

      // Then create the initial folder directly with ctx.db
      const initialFolderId = await ctx.db.insert('folders', {
        name: 'All Notes',
        depth: 0,
        isInitial: true,
        noteCount: 0,
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
