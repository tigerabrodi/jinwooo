import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants'
import { useAuthActions } from '@convex-dev/auth/react'
import { api } from '@convex/_generated/api'
import { useConvexAuth, useQuery } from 'convex/react'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { Outlet, useNavigate, useParams } from 'react-router'
import { FolderTree } from './components/root/folder-tree'

export function RootPage() {
  const user = useQuery(api.users.getCurrentUser)
  const state = useConvexAuth()
  const isLoading = user === undefined || state.isLoading
  const navigate = useNavigate()
  const { folderId } = useParams<{ folderId: string }>()

  const { signOut } = useAuthActions()

  useEffect(() => {
    if (!isLoading && user === null) {
      void navigate(ROUTES.authEntry)
    }
  }, [isLoading, user, navigate])

  useEffect(() => {
    // Is the user trying to navigate to `/notebook`?
    // redirect to their initial folder
    if (!isLoading && user && !folderId) {
      void navigate(ROUTES.authEntry)
    }
  }, [folderId, isLoading, navigate, user])

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <Loader2 className="size-10 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto flex h-full flex-1 rounded-lg border bg-background text-foreground">
      <div className="flex w-64 flex-col border-r border-border bg-sidebar">
        <FolderTree />

        <div className="p-2">
          <Button className="" onClick={() => void signOut()} variant="ghost">
            Logout
          </Button>
        </div>
      </div>

      <Outlet />
    </div>
  )
}
