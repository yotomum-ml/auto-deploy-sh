export const inquirerTypes = {
  INPUT: 'input',
  SELECT: 'select',
  CHECKBOX: 'checkbox',
  CONFIRM: 'confirm',
  NUMBER: 'number',
} as const

export type inquirerType = (typeof inquirerTypes)[keyof typeof inquirerTypes]

export type Choice<Value> = {
  value: Value
  name?: string
  description?: string
  short?: string
  disabled?: boolean | string
}
type theme = {
  prefix?: string | { idle: string; done: string }
  spinner?: {
    interval: number
    frames: string[]
  }
  style?: {
    answer?: (_text: string) => string
    message?: (_text: string, _status: 'idle' | 'done' | 'loading') => string
    error?: (_text: string) => string
    defaultAnswer?: (_text: string) => string
    [key: string]: any
  }
  icon?: {
    checked?: string
    unchecked?: string
    cursor?: string
  }
  helpMode?: 'always' | 'never' | 'auto'
}
export interface inquirerOptions<T = any> {
  type: inquirerType
  message: string
  default?: string | boolean | T
  choices?: readonly (Choice<T> | string | any)[]
  theme?: theme
  [key: string]: any
}
