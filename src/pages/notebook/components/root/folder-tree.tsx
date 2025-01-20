import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { ROUTES } from '@/lib/constants'
import { handlePromise } from '@/lib/utils'
import { api } from '@convex/_generated/api'
import { Id } from '@convex/_generated/dataModel'
import { useMutation, useQuery } from 'convex/react'
import { NotebookPen } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useState } from 'react'
import { generatePath, useNavigate } from 'react-router'
import { Folder } from './folder'
import { useFolders } from './useFolders'

export function FolderTree() {
  const folders = useQuery(api.folders.allFolders)
  const user = useQuery(api.users.getCurrentUser)

  const {
    expandedFolders,
    toggleFolder,
    getChildFolders,
    newFolderId,
    markFolderAsNew,
    unmarkFolderAsNew,
  } = useFolders(folders)

  const { toast } = useToast()
  const navigate = useNavigate()
  const createSubfolder = useMutation(api.folders.createFolder)

  const [folderIdToDelete, setFolderIdToDelete] =
    useState<Id<'folders'> | null>(null)

  const deleteFolder = useMutation(api.folders.deleteFolder)

  const updateFolder = useMutation(
    api.folders.updateFolder
  ).withOptimisticUpdate((localStore, args) => {
    const { id, data } = args
    const currentFolders = localStore.getQuery(api.folders.allFolders)

    if (currentFolders !== undefined) {
      // Create a completely new array with the updated folder
      const updatedFolders = currentFolders.map((folder) => {
        if (folder._id === id) {
          // Create a completely new folder object
          return {
            ...folder,
            ...data,
            // Add timestamp to force React to see it as a new value
            _updatedAt: Date.now(),
          }
        }
        return folder
      })

      // Ensure we're passing a new array reference
      localStore.setQuery(api.folders.allFolders, {}, [...updatedFolders])
    }
  })

  const handleUpdateFolder = useCallback(
    async (args: {
      id: Id<'folders'>
      data: Partial<typeof api.folders.updateFolder._args.data>
    }) => {
      await updateFolder(args)
    },
    [updateFolder]
  )

  const handleDeleteFolder = useCallback(
    async (args: { id: Id<'folders'> }) => {
      if (!user) return

      const [, error] = await handlePromise(deleteFolder({ id: args.id }))
      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete folder',
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Folder deleted',
        description: 'All notes and any subfolders will be deleted.',
        variant: 'default',
      })

      // if a folder is deleted, we know for sure initial will always be a valid folder
      void navigate(
        generatePath(ROUTES.notebookFolder, {
          folderId: user.initialFolderId,
        })
      )
    },
    [deleteFolder, navigate, toast, user]
  )

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
    // we start with null
    // means start with all folders at root level
    const childFolders = getChildFolders(parentId)

    if (!childFolders) return null

    return childFolders.map((folder) => {
      const hasChildren = folders.some((f) => f.parentId === folder._id)
      const isExpanded = expandedFolders.has(folder._id)

      const isNew = newFolderId === folder._id

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
            onToggle={(id) => toggleFolder(id)}
            onAddSubfolder={(args) => void handleAddSubfolder(args)}
            onUpdateFolder={(args) => void handleUpdateFolder(args)}
            onDelete={(id) => setFolderIdToDelete(id)}
            isNew={isNew}
            onNewStateChange={(newState) => {
              if (newState) {
                markFolderAsNew(folder._id)
              } else {
                unmarkFolderAsNew()
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
    <>
      <div className="flex-1 overflow-y-auto py-2">{renderFolders(null)}</div>
      <AlertDialog
        open={!!folderIdToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setFolderIdToDelete(null)
          }
        }}
      >
        <AlertDialogContent className="max-w-72 bg-content">
          <AlertDialogHeader className="flex max-w-full flex-col items-center gap-2 text-center">
            <NotebookPen className="size-10 text-primary" />
            <div className="flex flex-col gap-1">
              <AlertDialogTitle className="text-center text-sm text-primary-foreground">
                Are you sure you want to delete this folder?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center text-xs text-primary-foreground">
                All notes and any subfolders will be deleted.
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mx-auto mt-4">
            <AlertDialogCancel className="h-8 bg-sidebar text-sm">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                folderIdToDelete &&
                void handleDeleteFolder({ id: folderIdToDelete })
              }
              className="h-8 text-sm"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
