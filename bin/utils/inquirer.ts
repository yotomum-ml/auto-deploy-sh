import { input, select, checkbox, confirm, number } from '@inquirer/prompts'

import { chalk } from './chalk.ts'

import type { inquirerOptions } from '../type/inquirer.ts'

// https://www.npmjs.com/package/@inquirer/prompts
export class inquirer {
  static enumMethod = {
    INPUT: 'input',
    SELECT: 'select',
    CHECKBOX: 'checkbox',
    CONFIRM: 'confirm',
  } as const

  private static _enumMethod = {
    input: input,
    select: select,
    checkbox: checkbox,
    confirm: confirm,
    number: number,
  }

  static invoke(options: inquirerOptions) {
    const { type, ...args } = options
    switch (type) {
      case 'checkbox':
        args.message += ` Select by ${chalk.stress('Space bar check/cancel')}. Submit by ${chalk.stress('Enter')}`
        args.theme = {
          style: {
            description: (des: string) => chalk.stress(des),
          },
          icon: {
            unchecked: '○',
          },
          ...options.theme,
        }
        break
      case 'confirm':
        args.theme = {
          prefix: chalk.warn('✔'),
          style: {
            answer: (text: string) => chalk.done(text),
            error: (text: string) => chalk.error(text),
          },
        }
        break
      case 'select':
        if (!args.theme || !args.theme.spinner) {
          args.theme = {
            spinner: {
              interval: 80,
              frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
            },
            ...args.theme,
            style: {
              description: (des: string) => chalk.stress(des),
              ...options.theme?.style,
            },
          }
        }
        break
      default:
        break
    }
    // @ts-ignore
    return inquirer._enumMethod[type](args)
  }
}
