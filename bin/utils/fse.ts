import _fs from 'fs-extra'
import { log } from './logger.ts'
import _path from 'path'

import type { Error, fileData, ReadStreamOptions } from '../type/types.ts'
import type { PathOrFileDescriptor, WriteFileOptions, MakeDirectoryOptions } from 'fs'

// https://www.npmjs.com/package/fs-extra
export class fs {
  static _ = _fs

  static async exist(
    path: string,
    callbak?: (_err: Error, _exists: boolean) => void | Promise<boolean>,
  ): Promise<boolean> {
    const _callbak = (err: Error, exists: boolean): Promise<boolean> => {
      if (callbak) {
        callbak(err, exists)
      } else if (err) {
        log.error(`${err}`)
        return Promise.reject(false)
      }
      return Promise.resolve(exists)
    }
    let _exists = false,
      _err = null
    await _fs.pathExists(path).then(
      (exists: boolean) => (_exists = exists),
      (err: Error) => (_err = err),
    )
    return _callbak(_err, _exists)
  }

  static async getFileStat(path: string) {
    const exist = await fs.exist(path)
    if (!exist) {
      log.error(`The file does not exist in ${path}`)
      return Promise.reject(null)
    }
    return Promise.resolve(_fs.statSync(path))
  }

  static async isDirectory(path: string): Promise<Boolean> {
    const stat = await fs.getFileStat(path)
    return Promise.resolve(stat?.isDirectory() ?? false)
  }

  static removeSync(path: string) {
    _fs.removeSync(path)
  }

  static async remove(path: string, callbak?: (_err: Error, _status: boolean) => Promise<boolean>) {
    const _callbak = (err: Error, status: boolean): Promise<boolean> => {
      if (callbak) {
        callbak(err, status)
      } else if (err) {
        log.error(`${err}`)
        return Promise.reject(err)
      }
      return Promise.resolve(status)
    }
    let status: boolean = false,
      err: Error = null
    const exist = await fs.exist(path)
    if (!exist) {
      status = true
    } else {
      await _fs.remove(path).then(
        () => (status = true),
        _err => {
          status = false
          err = _err
        },
      )
    }

    return _callbak(err, status)
  }

  static async writeFileSync(
    file: PathOrFileDescriptor,
    data: fileData,
    options?: WriteFileOptions,
  ) {
    _fs.writeFileSync(file, data, options)
  }

  static mkdirSync(path: string, options?: MakeDirectoryOptions) {
    const _options = Object.assign(
      {
        recursive: true,
      },
      options,
    )
    return _fs.mkdirSync(path, _options)
  }

  // dir return fileNames, file retrun file content
  static async readDirOrFile(
    path: string,
    options?: { encoding?: BufferEncoding | null | undefined; flag?: string | null; signal?: any },
    callbak?: (_err: Error, _data: Buffer | Buffer[] | string | string[]) => void,
  ) {
    let _options: any = Object.assign(
      {
        encoding: 'utf8',
        flag: 'r',
      },
      options,
    )
    const _callbak = (err: Error, data: Buffer | Buffer[] | string | string[]) => {
      if (callbak) {
        callbak(err, data)
      } else if (err) {
        log.error(`${err}`)
        return Promise.reject(err)
      }
      return Promise.resolve(data)
    }
    let _err: Error = null,
      _data: Buffer | Buffer[] | string | string[] = Buffer.from('')
    const isDirectory = (await fs.getFileStat(path))?.isDirectory()
    try {
      if (isDirectory) {
        _data = await _fs.readdir(path, _options)
      } else {
        _data = await _fs.readFile(path, _options)
      }
    } catch (err) {
      _err = err as Error
    }
    return _callbak(_err, _data)
  }

  static async createReadStream(path: string, options?: ReadStreamOptions) {
    const exist = await fs.exist(path)
    if (!exist) {
      log.error(`The file does not exist in ${path}`)
      return Promise.reject(`The file does not exist in ${path}`)
    }
    return Promise.resolve(
      _fs.createReadStream(path, options).on('error', err => log.error(`${err}`)),
    )
  }

  static createWriteStream(path: string, options?: ReadStreamOptions) {
    const dir = _path.dirname(path)
    try {
      fs.mkdirSync(dir)
    } catch (err) {
      log.error(`${err}`)
    }

    return _fs.createWriteStream(path, options).on('error', err => log.error(`${err}`))
  }
}
