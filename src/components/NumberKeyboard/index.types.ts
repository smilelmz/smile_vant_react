export type KeyType = '' | 'delete' | 'extra' | 'close'
export type NumberKeyboardTheme = 'default' | 'custom'
export type KeyConfig = {
  text?: number | string
  type?: KeyType
  color?: string
  wider?: boolean
}

export interface NumberKeyboardProps {
  style?: Record<string, string | number>
  className?: string
  visible?: boolean
  title?: string
  zIndex?: number | string
  teleport?: HTMLElement | boolean
  teleportClassName?: string
  teleportStyle?: Record<string, any>
  transition?: boolean
  blurOnClose?: boolean
  showDeleteKey?: boolean
  randomKeyOrder?: boolean
  closeButtonText?: string
  deleteButtonText?: string
  closeButtonLoading?: boolean
  hideOnClickOutside?: boolean
  safeAreaInsetBottom?: boolean
  theme?: NumberKeyboardTheme
  value?: string
  extraKey?: string | string[]
  maxlength?: number | string
  titleLeft?: React.ReactNode | React.ReactNode[]
  customDeleteKey?: React.ReactNode | React.ReactNode[]
  customExtraKey?: React.ReactNode | React.ReactNode[]
  show?: VoidFunction
  hide?: VoidFunction
  blur?: VoidFunction
  input?: (text: string) => void
  close?: VoidFunction
  delete?: VoidFunction
  change?: (value: string) => void
}

export interface NumberKeyboardKeyProps {
  style?: Record<string, string | number>
  className?: string
  type?: KeyType
  text?: string | number
  color?: string
  wider?: boolean
  large?: boolean
  loading?: boolean
  children?: React.ReactNode | React.ReactNode[]
  press?: (text: string | number, type: KeyType) => void
}
