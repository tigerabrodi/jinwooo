import { useToast } from '@/hooks/use-toast'
import { ROUTES } from '@/lib/constants'
import { handlePromise } from '@/lib/utils'
import { api } from '@convex/_generated/api'
import { Id } from '@convex/_generated/dataModel'
import { useMutation, useQuery } from 'convex/react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback } from 'react'
import { generatePath, useNavigate } from 'react-router'
import { Folder } from './folder'
import { useFolders } from './useFolders'

export function FolderTree() {
  const folders = useQuery(api.folders.allFolders)

  const {
    expandedFolders,
    toggleFolder,
    getChildFolders,
    newFolderIds,
    markFolderAsNew,
    unmarkFolderAsNew,
  } = useFolders(folders)

  const { toast } = useToast()
  const navigate = useNavigate()
  const createSubfolder = useMutation(api.folders.createFolder)

  const handleAddSubfolder = useCallback(
    async ({
      parentId,
      depth,
      shouldExpand,
      currentFolderId,
    }: {
      parentId: string | null
      depth: number
      shouldExpand: boolean
      currentFolderId: string
    }) => {
      const [newFolderId, error] = await handlePromise(
        createSubfolder({
          parentId: parentId as Id<'folders'>,
          depth,
          name: 'New Folder',
        })
      )

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to create subfolder',
          variant: 'destructive',
        })
        return
      }

      if (shouldExpand) {
        toggleFolder(currentFolderId)
      }

      markFolderAsNew(newFolderId)

      const newFolderPath = generatePath(ROUTES.notebookFolder, {
        folderId: newFolderId,
      })

      void navigate(newFolderPath)
    },
    [createSubfolder, markFolderAsNew, navigate, toast, toggleFolder]
  )

  if (!folders) {
    return (
      <div className="flex-1 overflow-y-auto py-2">
        {/* Root level skeletons - usually 2-3 is enough */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center gap-2 py-1 pl-2 pr-3">
              <div className="flex h-6 items-center gap-1">
                {/* Chevron placeholder */}
                <div className="size-3" />
                {/* Folder icon placeholder */}
                <div className="size-4 rounded bg-primary/20" />
              </div>
              {/* Name placeholder */}
              <div className="h-4 flex-1 rounded bg-primary/20" />
              {/* Count placeholder */}
              <div className="h-3 w-4 rounded bg-primary/20" />
            </div>
            {/* Add nested skeletons for first item only */}
            {i === 0 && (
              <div className="ml-4">
                {Array.from({ length: 2 }).map((_, j) => (
                  <div key={j} className="animate-pulse">
                    <div className="flex items-center gap-2 py-1 pl-2 pr-3">
                      <div className="flex h-6 items-center gap-1">
                        <div className="size-3" />
                        <div className="size-4 rounded bg-primary/20" />
                      </div>
                      <div className="h-4 flex-1 rounded bg-primary/20" />
                      <div className="h-3 w-4 rounded bg-primary/20" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderFolders = (parentId: string | null) => {
    const childFolders = getChildFolders(parentId)

    if (!childFolders) return null

    return childFolders.map((folder) => {
      const hasChildren = folders.some((f) => f.parentId === folder._id)
      const isExpanded = expandedFolders.has(folder._id)

      const isNew = newFolderIds.has(folder._id)

      return (
        <div key={folder._id}>
          <Folder
            id={folder._id}
            name={folder.name}
            depth={folder.depth}
            isRoot={folder.isInitial}
            noteCount={folder.noteCount}
            hasChildren={hasChildren}
            isExpanded={isExpanded}
            onToggle={() => toggleFolder(folder._id)}
            onAddSubfolder={(args) => void handleAddSubfolder(args)}
            isNew={isNew}
            onNewStateChange={(newState: boolean) => {
              if (newState) {
                markFolderAsNew(folder._id)
              } else {
                unmarkFolderAsNew(folder._id)
              }
            }}
          />
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {renderFolders(folder._id)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )
    })
  }

  return (
    <div className="flex-1 overflow-y-auto py-2">{renderFolders(null)}</div>
  )
}
