import { chalk } from './chalk.ts'

function format(msg: string, label: string = '') {
  return label
    ? `[${label}]:${msg
        .split('\n')
        .map((line, i) => line.padStart((i !== 0 ? label.length : 0) + line.length + 1))
        .join('\n')}`
    : msg
}

class LogClass {
  log(msg: string, label: string = '') {
    console.log(format(msg, label))
  }
  warn(msg: string, label: string = '') {
    if (!label) {
      label = 'Warning'
      msg.startsWith('Warning:') && (msg = msg.replace('Warning:', '').trimStart())
    }
    console.warn(chalk.warn(format(msg, label)))
  }
  error(msg: string, label: string = '') {
    if (!label) {
      label = 'Error'
      msg.startsWith('Error:') && (msg = msg.replace('Error:', '').trimStart())
    }
    console.error(chalk.error(format(msg, label)))
  }
  info(msg: string, label: string = '') {
    if (!label) {
      label = 'Info'
      msg.startsWith('Info:') && (msg = msg.replace('Info:', '').trimStart())
    }
    console.error(chalk.info(format(msg, label)))
  }
  done(msg: string, label: string = '') {
    if (!label) {
      label = 'Done'
      msg.startsWith('Done:') && (msg = msg.replace('Done:', '').trimStart())
    }
    console.log(chalk.done(format(msg, label)))
  }
  primary(msg: string, label: string = '') {
    console.log(chalk.primary(format(msg, label)))
  }
}

export const log = new LogClass()
