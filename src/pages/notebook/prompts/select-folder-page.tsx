// we only end up here if user is trying to navigate to `/notebook`
// where we then redirect them anyways
export function SelectFolderPage() {
  return (
    <div className="flex w-80 flex-col items-center justify-center border-r border-border bg-background">
      <p className="my-auto text-lg font-medium text-muted-foreground">
        Select a folder to start
      </p>
    </div>
  )
}
