import { cn } from '@/lib/utils'
import { ComponentProps } from 'react'

type HeaderProps = ComponentProps<'div'>

export function Header({ children, className, ...props }: HeaderProps) {
  return (
    <div
      className={cn(
        'flex h-14 items-center border-b bg-sidebar px-2',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
