export function Header({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-sidebar flex h-14 items-center border-b px-2">
      {children}
    </div>
  )
}
