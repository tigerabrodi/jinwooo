import { ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Doc } from '@convex/_generated/dataModel'
import { generatePath, useNavigate, useParams } from 'react-router'

export function NoteItem({ note }: { note: Doc<'notes'> }) {
  const { folderId, noteId: currentlySelectedNoteId } = useParams<{
    folderId: string
    noteId: string
  }>()
  const isSelected = currentlySelectedNoteId === note._id
  const navigate = useNavigate()

  const navigateToNote = () => {
    void navigate(
      generatePath(ROUTES.notebookNote, {
        folderId: folderId!,
        noteId: note._id,
      })
    )
  }

  return (
    <button
      key={note._id}
      onClick={navigateToNote}
      className={cn('flex w-full flex-col gap-2 rounded p-2 text-left', {
        'bg-primary': isSelected,
      })}
    >
      <div className="line-clamp-1 text-sm font-bold">{note.title}</div>
      <div className="flex items-center gap-2">
        <div
          className={cn('text-xs text-muted-foreground', {
            'text-primary-foreground': isSelected,
          })}
        >
          {new Date(note.updatedAt).toLocaleDateString()}
        </div>
        <div
          className={cn('line-clamp-1 text-xs text-muted-foreground', {
            'text-primary-foreground': isSelected,
          })}
        >
          {note.content}
        </div>
      </div>
    </button>
  )
}

// Add this export alongside NoteItem in the same file
export function NoteItemSkeleton() {
  return (
    <div className="flex w-full flex-col gap-2 rounded p-2">
      {/* Title shimmer */}
      <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />

      {/* Date and preview text shimmer */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-16 animate-pulse rounded bg-muted" />
        <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}

export function NotesListSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="mb-2 select-none text-xs font-medium text-muted-foreground">
        Notes
      </h2>
      {Array.from({ length: 5 }).map((_, i) => (
        <NoteItemSkeleton key={i} />
      ))}
    </div>
  )
}
