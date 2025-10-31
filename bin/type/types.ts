export type Error = NodeJS.ErrnoException | null

export type sshConfig = {
  host: string
  port: number | string
  user: string
  password: string
  beforLaunch: string[]
  Dockerfile: string
  dockerBuildFiles: string[]
  imageTag: string
  containerName: string
  BindPorts: string
  Options: {
    volumes: string[]
    networks: string
  }
}

export type fileData = string | NodeJS.ArrayBufferView

import type { promises } from 'fs'
interface StreamOptions {
  flags?: string | undefined
  encoding?: BufferEncoding | undefined
  fd?: number | promises.FileHandle | undefined
  mode?: number | undefined
  autoClose?: boolean | undefined
  emitClose?: boolean | undefined
  start?: number | undefined
  signal?: AbortSignal | null | undefined
  highWaterMark?: number | undefined
}
interface streamOptions extends StreamOptions {
  fs?: any | null | undefined
  end?: number | undefined
  flush?: boolean | undefined
}
export type ReadStreamOptions = BufferEncoding | streamOptions
