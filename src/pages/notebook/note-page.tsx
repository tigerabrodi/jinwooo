import { handlePromise } from '@/lib/utils'
import { api } from '@convex/_generated/api'
import { Id } from '@convex/_generated/dataModel'
import { useMutation, useQuery } from 'convex/react'
import { useAtom } from 'jotai'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { editorStatusAtom } from './atoms/editor'
import { useDebounceCallback } from './hooks/useDebounceCallback'

const DEBOUNCE_DELAY = 500

export function NotePageWrapper() {
  const { noteId: selectedNoteId } = useParams<{ noteId: Id<'notes'> }>()

  // key is needed
  // otherwise the component will not remount when the noteId changes
  // that's what we want for local states to be reset
  return <NotePage key={selectedNoteId} />
}

export function NotePage() {
  const { noteId: selectedNoteId } = useParams<{ noteId: Id<'notes'> }>()
  const note = useQuery(api.notes.getNoteById, {
    id: selectedNoteId as Id<'notes'>,
  })
  const updateNote = useMutation(api.notes.updateNote)

  const [, setStatus] = useAtom(editorStatusAtom)

  const [localContent, setLocalContent] = useState('')
  const [localTitle, setLocalTitle] = useState('')

  useEffect(() => {
    const shouldInitialize = note && !localContent && !localTitle
    if (shouldInitialize) {
      setLocalContent(note.content)
      setLocalTitle(note.title)
    }
  }, [note, localContent, localTitle])

  const debouncedUpdate = useDebounceCallback(
    (id: Id<'notes'>, data: { title?: string; content?: string }) => {
      async function update() {
        setStatus('pending')
        const [, error] = await handlePromise(updateNote({ id, data }))
        if (error) {
          setStatus('error')
        } else {
          setStatus('success')
        }
      }

      void update()
    },
    DEBOUNCE_DELAY
  )

  const handleContentChange = useCallback(
    (newContent: string) => {
      // should never happen
      if (!selectedNoteId) return

      setLocalContent(newContent)
      debouncedUpdate(selectedNoteId, { content: newContent })
    },
    [debouncedUpdate, selectedNoteId]
  )

  if (!selectedNoteId) return null

  const isNoteLoading = note === undefined

  return (
    <div className="flex flex-1 flex-col bg-content">
      <div className="flex flex-1 flex-col gap-4 p-4">
        <label htmlFor="note-title" className="sr-only">
          Note title
        </label>

        {isNoteLoading ? (
          <div className="h-5 w-2/4 animate-pulse rounded bg-muted" />
        ) : (
          <input
            type="text"
            id="note-title"
            name="note-title"
            value={localTitle}
            onChange={(event) => {
              setLocalTitle(event.target.value)
              debouncedUpdate(selectedNoteId, { title: event.target.value })
            }}
            className="border-none bg-transparent text-xl font-medium outline-none"
            placeholder="Note title"
          />
        )}

        <label htmlFor="note-content" className="sr-only">
          Note content
        </label>

        {isNoteLoading ? (
          <div className="h-20 w-full animate-pulse rounded bg-muted" />
        ) : (
          <textarea
            id="note-content"
            name="note-content"
            value={localContent}
            onChange={(event) => handleContentChange(event.target.value)}
            className="flex-1 resize-none border-none bg-transparent outline-none"
            placeholder="Start writing..."
          />
        )}
      </div>
    </div>
  )
}
