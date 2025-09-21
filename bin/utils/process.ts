import { log } from './logger.ts'
import { execa } from 'execa'

import type { Options } from 'execa'
export function exit(code: number) {
  try {
    if (code > 0) {
      process.exit(code)
    } else {
      throw Error('The code for process exit must be greater than zero')
    }
  } catch (err) {
    log.error(`${err}`)
  }
}
/**
 * run('git init') -> exca('git', ['init']) -> cmd: git init
 */
export function run(command: string, context?: string, options?: Options, args?: string[]) {
  if (command === '' || !command) {
    log.error('command cannot be empty')
    return Promise.reject()
  }
  const _context = context ?? process.cwd()
  let cmd = command
  if (!args) {
    const parts = command.trim().split(/\s+/)
    cmd = parts[0] as string
    if (parts.length > 1) {
      args = parts.slice(1)
    }
  }
  return execa(cmd, args, { cwd: _context, ...options })
}
