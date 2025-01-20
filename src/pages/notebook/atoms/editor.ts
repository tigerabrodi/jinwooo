import { atom } from 'jotai'

export type EditorStatus = 'idle' | 'pending' | 'success' | 'error'

export const editorStatusAtom = atom<EditorStatus>('idle')
