import { NoteEditorPanel } from './components/folder/note-editor-panel'
import { NoteListPanel } from './components/folder/note-list-panel'

export function FolderPage() {
  return (
    <>
      <NoteListPanel />
      <NoteEditorPanel />
    </>
  )
}
