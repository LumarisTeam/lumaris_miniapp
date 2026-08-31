import type { HTMLAttributes, InputHTMLAttributes, PropsWithChildren } from 'react'

export function View({ children, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return <div {...props}>{children}</div>
}

export function Text({ children, ...props }: PropsWithChildren<HTMLAttributes<HTMLSpanElement>>) {
  return <span {...props}>{children}</span>
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} />
}
