import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants'
import { useAuthActions } from '@convex-dev/auth/react'
import { api } from '@convex/_generated/api'
import { useConvexAuth, useQuery } from 'convex/react'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router'
import { FolderTree } from './components/root/folder-tree'
import { Sidebar } from './components/root/sidebar'

export function RootPage() {
  const user = useQuery(api.users.getCurrentUser)
  const state = useConvexAuth()
  const isLoading = user === undefined || state.isLoading
  const navigate = useNavigate()

  const { signOut } = useAuthActions()

  useEffect(() => {
    if (!isLoading && user === null) {
      void navigate(ROUTES.authEntry)
    }
  }, [isLoading, user, navigate])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Loader2 className="size-10 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto flex h-full flex-1 rounded-lg border bg-background text-foreground">
      {/* Sidebar */}
      <Sidebar>
        <FolderTree />
        <Button className="" onClick={() => void signOut()}>
          Logout
        </Button>
      </Sidebar>

      <Outlet />

      {/* <NoteListPanel />
      <NoteEditorPanel /> */}
    </div>
  )
}
