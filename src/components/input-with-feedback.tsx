import { cn } from '@/lib/utils'
import type { ComponentProps } from 'react'
import { Input } from './ui/input'

type InputWithFeedbackProps = ComponentProps<'input'> & {
  errorMessage?: string
  isError?: boolean
  helperText?: string
}

export function InputWithFeedback({
  errorMessage,
  helperText,
  isError,
  className,
  ...props
}: InputWithFeedbackProps) {
  return (
    <div className="relative w-full">
      <Input
        className={cn('w-full', className, {
          'border-red-500': isError,
        })}
        {...props}
      />
      {isError && (
        <p className="absolute -bottom-6 text-xs text-red-500">
          {errorMessage}
        </p>
      )}

      {!isError && helperText && (
        <p className="absolute -bottom-6 text-xs text-muted-foreground">
          {helperText}
        </p>
      )}
    </div>
  )
}
