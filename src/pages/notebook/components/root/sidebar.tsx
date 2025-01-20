export function Sidebar({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-sidebar flex w-64 flex-col border-r border-border">
      {children}
    </div>
  )
}
