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

export function NotePage() {
  const { noteId: selectedNoteId } = useParams<{ noteId: Id<'notes'> }>()

  const note = useQuery(api.notes.getNoteById, { id: selectedNoteId })
  const updateNote = useMutation(api.notes.updateNote)

  const [, setStatus] = useAtom(editorStatusAtom)

  const [localContent, setLocalContent] = useState('')
  const [localTitle, setLocalTitle] = useState('')

  useEffect(() => {
    const isNoteLoading = note === undefined
    const areLocalStateEmpty = localContent === '' && localTitle === ''
    const shouldInitializeLocalState =
      note && areLocalStateEmpty && !isNoteLoading

    if (shouldInitializeLocalState) {
      setLocalContent(note.content)
      setLocalTitle(note.title)
    }
  }, [localContent, localTitle, note, setLocalContent, setLocalTitle])

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

  return (
    <div className="flex flex-1 flex-col bg-content">
      <div className="flex flex-1 flex-col gap-4 p-4">
        <label htmlFor="note-title" className="sr-only">
          Note title
        </label>
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

        <label htmlFor="note-content" className="sr-only">
          Note content
        </label>
        <textarea
          id="note-content"
          name="note-content"
          value={localContent}
          onChange={(event) => handleContentChange(event.target.value)}
          className="flex-1 resize-none border-none bg-transparent outline-none"
          placeholder="Start writing..."
        />
      </div>
    </div>
  )
}
