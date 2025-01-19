import { Route, Routes } from 'react-router'
import { AuthEntryPage } from './pages/auth-entry'
import { FolderPage } from './pages/notebook/folder-page'
import { NotePage } from './pages/notebook/note-page'
import { SelectFolderPage } from './pages/notebook/prompts/select-folder-page'
import { SelectNotePage } from './pages/notebook/prompts/select-note-page'
import { RootPage } from './pages/notebook/root-page'

function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthEntryPage />} />

      <Route path="notebook" element={<RootPage />}>
        <Route index element={<SelectFolderPage />} />
        <Route path=":folderId" element={<FolderPage />}>
          <Route index element={<SelectNotePage />} />
          <Route path=":noteId" element={<NotePage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
