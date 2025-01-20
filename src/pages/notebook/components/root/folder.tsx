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
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { useToast } from '@/hooks/use-toast'
import { ROUTES } from '@/lib/constants'
import { cn, handlePromise } from '@/lib/utils'
import { api } from '@convex/_generated/api'
import { Id } from '@convex/_generated/dataModel'
import { useMutation } from 'convex/react'
import { ChevronRight, Folder as FolderIcon, NotebookPen } from 'lucide-react'
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router'

type FolderProps = {
  id: Id<'folders'>
  name: string
  depth: number
  isRoot: boolean
  noteCount: number
  hasChildren: boolean
  isExpanded: boolean
  onToggle: (id: Id<'folders'>) => void
  isNew: boolean
  onNewStateChange: (isNew: boolean) => void
  onAddSubfolder: ({
    parentId,
    depth,
    shouldExpand,
    currentFolderId,
  }: {
    parentId: Id<'folders'>
    depth: number
    shouldExpand: boolean
    currentFolderId: Id<'folders'>
  }) => void
}

export function Folder({
  id,
  name,
  depth,
  isRoot,
  hasChildren,
  isExpanded,
  noteCount,
  onToggle,
  isNew,
  onNewStateChange,
  onAddSubfolder,
}: FolderProps) {
  const params = useParams<{ folderId: string }>()
  const navigate = useNavigate()
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

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const { toast } = useToast()

  const isSelected = params.folderId === id

  const [isEditing, setIsEditing] = useState(isNew)
  const [editedName, setEditedName] = useState(name)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setEditedName(name)
  }, [name])

  // if new folder
  // queue the focus and select to the next frame
  // otherwise re render will remove the focus and select
  // YES, this is because of hovering radix menu item
  useLayoutEffect(() => {
    if (isNew) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isNew])

  const onDelete = async () => {
    const [, error] = await handlePromise(deleteFolder({ id }))
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
  }

  const handleAddSubfolder = () => {
    const parentId = isRoot ? null : id
    const newDepth = isRoot ? 0 : depth + 1

    void onAddSubfolder({
      parentId: parentId as Id<'folders'>,
      depth: newDepth,
      shouldExpand: !isExpanded,
      currentFolderId: id,
    })
  }

  const handleRename = async () => {
    const originalName = name
    const isNewNameEmpty = editedName.trim() === ''
    const isNameChanged = editedName.trim() !== originalName.trim()
    const newName = editedName.trim()

    const shouldRename = isNameChanged && !isNewNameEmpty
    if (shouldRename) {
      // First set local UI state and exit edit mode
      setEditedName(newName)
      setIsEditing(false)
      onNewStateChange(false)

      // Then trigger the mutation
      await handlePromise(
        updateFolder({
          id,
          data: {
            name: newName,
          },
        })
      )
    } else {
      // Just reset the state if no real change
      setEditedName(name)
      setIsEditing(false)
      onNewStateChange(false)
    }
  }

  const navigateToFolder = () => {
    void navigate(generatePath(ROUTES.notebookFolder, { folderId: id }))
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      navigateToFolder()
    }
  }

  function startRenaming() {
    setIsEditing(true)

    // queue the focus to the next frame
    // otherwise won't work since setIsEditing triggers a re-render (async)
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus()
        inputRef.current.select()
      }
    })
  }

  const handleBlur = (event: React.FocusEvent) => {
    // Bug where blurring happens when the menu closes and you quickly hover a menu item
    // If this happens, we know we shouldn't exit the editing mode
    // super painful to debug, fml
    const isRadixMenuItem = event.relatedTarget?.hasAttribute(
      'data-radix-collection-item'
    )

    if (!event.relatedTarget || !isRadixMenuItem) {
      console.log('blur happening')
      void handleRename()
    } else {
      requestAnimationFrame(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      })
    }
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            role="button"
            tabIndex={0}
            onClick={navigateToFolder}
            onKeyDown={handleKeyDown}
            className={cn(
              'relative flex w-full items-center gap-2 py-1 pl-2 pr-3 text-left text-sm text-foreground/90',
              {
                'bg-primary': isSelected,
              }
            )}
          >
            <div
              className="flex h-6 items-center gap-1"
              style={{
                paddingLeft: `${depth * 8}px`,
              }}
            >
              {hasChildren ? (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.stopPropagation()
                    onToggle(id)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.stopPropagation()
                      onToggle(id)
                    }
                  }}
                  className="rounded"
                >
                  <ChevronRight
                    className={cn(
                      'size-3 shrink-0 transition-transform duration-200',
                      {
                        'rotate-90': isExpanded,
                      }
                    )}
                  />
                </div>
              ) : (
                // placeholder for the folder icon
                // otherwise we need to manage all the margin left and stuff
                // it becomes too complicated for this little component
                <div className="size-3" />
              )}
              <FolderIcon
                className={cn('size-4 shrink-0 text-primary', {
                  'text-foreground': isSelected,
                })}
              />
            </div>
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editedName}
                onChange={(event) => setEditedName(event.target.value)}
                onBlur={handleBlur}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void handleRename()
                  }

                  // Only stop propagation for keyboard events
                  event.stopPropagation()
                }}
                className="h-6 min-w-0 flex-1 rounded-md border-2 border-yellow-200 bg-content pl-1 outline-none"
              />
            ) : (
              <span className="flex-1 select-none truncate">{name}</span>
            )}
            <span
              className={cn(
                'flex-shrink-0 select-none text-xs text-muted-foreground',
                {
                  'text-foreground': isSelected,
                }
              )}
            >
              {noteCount}
            </span>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent
          // Needed otherwise context menu's focus will go back to folder button (how focus trap works)
          // Not what we want if editing
          // If deletion, focus should probably just go back to the sidebar itself
          onCloseAutoFocus={(event) => {
            event.preventDefault()
          }}
        >
          {!isRoot && (
            <ContextMenuItem
              onSelect={startRenaming}
              className="px-2 py-1 text-sm text-primary-foreground hover:bg-primary"
            >
              Rename folder
            </ContextMenuItem>
          )}
          <ContextMenuItem
            onSelect={() => void handleAddSubfolder()}
            className="px-2 py-1 text-sm text-primary-foreground hover:bg-primary"
          >
            New folder
          </ContextMenuItem>
          {!isRoot && (
            <ContextMenuItem
              onSelect={() => void onDelete()}
              className="px-2 py-1 text-sm text-primary-foreground hover:bg-primary"
            >
              Delete folder
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
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
              onClick={() => void onDelete()}
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
