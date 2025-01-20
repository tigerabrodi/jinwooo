import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants'
import { api } from '@convex/_generated/api'
import { Id } from '@convex/_generated/dataModel'
import { useMutation, useQuery } from 'convex/react'
import { Trash } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { generatePath, useNavigate, useParams } from 'react-router'
import { Header } from '../header'
import { NoteItem, NotesListSkeleton } from './note-item'

export function NoteListPanel() {
  const { noteId: selectedNoteId, folderId } = useParams<{
    noteId: string
    folderId: string
  }>()

  const deleteNote = useMutation(api.notes.deleteNote).withOptimisticUpdate(
    (localStore, args) => {
      const existingNotes = localStore.getQuery(api.notes.getNotesByFolderId, {
        folderId: folderId as Id<'folders'>,
      })
      const existingFolders = localStore.getQuery(api.folders.allFolders)

      if (!existingNotes || !existingFolders) return

      const updatedNotes = existingNotes.filter(
        (note) => note._id !== args.noteId
      )

      const folder = existingFolders.find(
        (folder) => folder._id === args.folderId
      )
      const initialFolder = existingFolders.find((folder) => folder.isInitial)

      // should never happen
      if (!folder || !initialFolder) return

      // Determine which folders need updating (same logic as backend)
      const foldersToUpdate = new Set([folder._id, initialFolder._id])

      // Update folder counts
      const optimisticFolders = existingFolders.map((folder) =>
        foldersToUpdate.has(folder._id)
          ? { ...folder, noteCount: folder.noteCount - 1 }
          : folder
      )

      // Update both queries
      localStore.setQuery(
        api.notes.getNotesByFolderId,
        { folderId: folderId as Id<'folders'> },
        updatedNotes
      )
      localStore.setQuery(api.folders.allFolders, {}, optimisticFolders)
    }
  )

  const notes = useQuery(api.notes.getNotesByFolderId, {
    folderId: folderId as Id<'folders'>,
  })

  const navigate = useNavigate()

  const handleDeleteNote = () => {
    if (!selectedNoteId || !notes || !folderId) return

    // Find current index
    const currentIndex = notes.findIndex((note) => note._id === selectedNoteId)

    // Get next note (or previous if we're at the end)
    const nextNote =
      currentIndex !== -1
        ? notes[(currentIndex + 1) % notes.length] || notes[currentIndex - 1]
        : null

    void deleteNote({
      noteId: selectedNoteId as Id<'notes'>,
      folderId: folderId as Id<'folders'>,
    })

    if (nextNote) {
      void navigate(
        generatePath(ROUTES.notebookNote, {
          noteId: nextNote._id,
          folderId,
        })
      )
    } else {
      void navigate(generatePath(ROUTES.notebook, { folderId }))
    }
  }

  return (
    <div className="flex w-80 flex-col border-r border-border bg-background">
      <Header>
        <Button
          variant="ghost"
          size="icon"
          disabled={!selectedNoteId}
          onClick={handleDeleteNote}
          className="ml-auto"
          aria-label="Delete note"
        >
          <Trash className="size-5" />
        </Button>
      </Header>

      <NotesList />
    </div>
  )
}

function NotesList() {
  const { folderId } = useParams<{ folderId: Id<'folders'> }>()

  const notes = useQuery(api.notes.getNotesByFolderId, {
    folderId: folderId!,
  })

  const isLoading = notes === undefined

  if (isLoading) {
    return <NotesListSkeleton />
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="flex flex-col gap-4 p-4">
        <h2 className="mb-2 select-none text-xs font-medium text-muted-foreground">
          Notes
        </h2>
        <AnimatePresence>
          {notes.map((note) => (
            <motion.div
              key={note._id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex flex-col gap-2"
              layout // This ensures other notes smoothly reposition
            >
              <NoteItem note={note} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
