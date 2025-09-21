import _chalk from 'chalk'

export const chalk = {
  _: _chalk,
  warn: _chalk.yellow,
  error: _chalk.hex('#F56C6C'),
  info: _chalk.hex('#F2F6FC'),
  done: _chalk.hex('#67C23A'),
  primary: _chalk.hex('#409EFF'),
  stress: _chalk.hex('#d3fac1'),
}
