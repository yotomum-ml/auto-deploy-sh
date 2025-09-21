import _ora from 'ora'
import { chalk } from './chalk.ts'

import type { Ora, Options, PersistOptions } from 'ora'
import type { Error } from '../type/types.ts'

// https://www.npmjs.com/package/ora
export class ora {
  private static spinner?: Ora | null
  static _ = _ora

  static async start(
    options: string | Options,
    fn?: Function,
    callbak?: (_status: boolean, _err?: Error | any) => string,
  ) {
    let _options: any = {
      spinner: 'dots',
      color: 'blue',
      text: '...',
    }
    const isText = typeof options == 'string'
    if (isText) {
      _options['text'] = options
    } else {
      _options = {
        ..._options,
        ...options,
      }
    }
    if (ora.spinner) ora.spinner?.stop()
    ora.spinner = _ora(_options)
    ora.spinner.start()
    if (fn) {
      let _err: Error | any = null
      let status: boolean = false
      try {
        if (fn.constructor.name === 'AsyncFunction') {
          await fn().then(
            () => (status = true),
            () => (status = false),
          )
        } else {
          fn()
          status = true
        }
      } catch (err) {
        _err = err
        status = false
      } finally {
        if (status) {
          ora.stop(
            'succeed',
            callbak ? callbak(status) : chalk.done(`Succeed ${isText ? options : 'done'}`),
          )
        } else {
          ora.stop('fail', callbak ? callbak(status, _err) : chalk.error(`Error: ${_err}`))
        }
      }
    }
  }

  static text(text: string) {
    ora.spinner && (ora.spinner.text = text)
  }

  static stop(type?: 'info' | 'warn' | 'fail' | 'succeed', text?: string) {
    if (!type) ora.spinner?.stop()
    else ora.spinner && ora.spinner[type](text)
    ora.spinner = null
  }

  static stopAndPersist(options?: PersistOptions) {
    ora.spinner &&
      ora.spinner.stopAndPersist({
        symbol: chalk.done('✔'),
        ...options,
      })
    ora.spinner = null
  }

  static hasSpinner() {
    return ora.spinner
  }
}
