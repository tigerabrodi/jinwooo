export const TAB_VALUES = {
  LOGIN: 'login',
  REGISTER: 'register',
} as const

export const ROUTES = {
  login: '/login',
  register: '/register',
  notebook: '/notebook',
  notebookFolder: '/notebook/:folderId',
  notebookNote: '/notebook/:folderId/:noteId',
} as const
