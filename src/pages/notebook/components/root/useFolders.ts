import { Doc } from '@convex/_generated/dataModel'
import { useCallback, useState } from 'react'

export function useFolders(initialFolders: Array<Doc<'folders'>> | undefined) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [newFolderId, setNewFolderId] = useState<string | null>(null)

  // Add a function to mark a folder as new
  const markFolderAsNew = useCallback((folderId: string) => {
    setNewFolderId(folderId)
  }, [])

  // Add a function to unmark a folder as new
  const unmarkFolderAsNew = useCallback(() => {
    setNewFolderId(null)
  }, [])

  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders((current) => {
      const next = new Set(current)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }, [])

  const getChildFolders = useCallback(
    (parentId: string | null) => {
      const children = initialFolders?.filter(
        (folder) => folder.parentId === parentId
      )

      if (parentId === null) {
        return children?.sort((a, b) => {
          if (a.isInitial) return -1
          if (b.isInitial) return 1
          return 0
        })
      }

      return children
    },
    [initialFolders]
  )

  return {
    folders: initialFolders,
    expandedFolders,
    toggleFolder,
    getChildFolders,
    markFolderAsNew,
    unmarkFolderAsNew,
    newFolderId,
  }
}
