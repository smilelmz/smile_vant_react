import { LoadingType } from '../Loading/index.types'

export type ToastType = 'text' | 'loading' | 'success' | 'fail' | 'html'
export type ToastPosition = 'middle' | 'top' | 'bottom'

export interface ToastProps {
  type?: ToastType
  position?: ToastPosition
  message?: string
  icon?: string
  iconSize?: number | string
  iconPrefix?: string
  mask?: boolean
  loadingType?: LoadingType
  duration?: number
  className?: string
  onOpened?: VoidFunction
  onClose?: VoidFunction
}
