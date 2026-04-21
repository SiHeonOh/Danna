import type { ButtonHTMLAttributes } from 'react'
import { clsx } from 'clsx'

type Variant = 'neon' | 'pink' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export default function Button({ variant = 'neon', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        variant === 'neon' && 'btn-neon',
        variant === 'pink' && 'btn-pink',
        variant === 'ghost' && 'btn-ghost',
        variant === 'danger' && 'btn-pink',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
