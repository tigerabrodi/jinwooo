import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { ROUTES } from '@/lib/constants'
import { handlePromise } from '@/lib/utils'
import { api } from '@convex/_generated/api'
import { Id } from '@convex/_generated/dataModel'
import { useMutation } from 'convex/react'
import { Plus } from 'lucide-react'
import { useActionState } from 'react'
import { generatePath, Outlet, useNavigate, useParams } from 'react-router'
import { Header } from '../header'

export function NoteEditorPanel() {
  const { folderId } = useParams<{ folderId: string }>()
  const { toast } = useToast()

  const navigate = useNavigate()

  const createNote = useMutation(api.notes.createNote)

  const [, formAction, isPending] = useActionState<object, FormData>(
    async () => {
      if (!folderId) return { status: 'error' }

      const [newNoteId, error] = await handlePromise(
        createNote({
          folderId: folderId as Id<'folders'>,
          title: 'New Note',
          content: 'Some sample body text.',
        })
      )

      if (error) {
        console.error(error)
        toast({
          title: 'Failed to create note',
          description: 'Please try again later.',
          variant: 'destructive',
        })
        return
      }

      void navigate(
        generatePath(ROUTES.notebookNote, { noteId: newNoteId, folderId })
      )
    },
    {}
  )

  return (
    <div className="flex flex-1 flex-col">
      <Header>
        <form action={formAction}>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Create new note"
            type="submit"
            disabled={isPending}
            isLoading={isPending}
          >
            <Plus className="size-5" />
          </Button>
        </form>
      </Header>

      <Outlet />
    </div>
  )
}
