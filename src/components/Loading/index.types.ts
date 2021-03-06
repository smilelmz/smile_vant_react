export type LoadingType = 'circular' | 'spinner'
export interface LoadingProps {
  className?: string
  type?: LoadingType
  size?: string | number
  color?: string
  vertical?: boolean
  textSize?: string | number
  textColor?: string
  children?: React.ReactNode | React.ReactNode[]
}
