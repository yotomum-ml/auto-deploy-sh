import type { sshConfig } from './type/types'
import { log, ora, run, fs, exit, chalk } from './utils/index.ts'
import path from 'path'
import archiver from 'archiver'
import type { Options } from 'execa'
import type { NodeSSH } from 'node-ssh'

export class Deploy {
  config: sshConfig
  context: string
  uploadFileName: string
  remotePath: string
  REMOTEAPPPATH = '/tmp/www/app'

  constructor(config: sshConfig, context: string) {
    this.config = config
    this.context = context
    this.uploadFileName = `${this.config.containerName}.tar.gz`
    this.remotePath = `/tmp/${this.uploadFileName}`
  }

  async runCommon(
    _options: { command: string; context?: string; options?: Options; args?: string[] },
    std: { startMsg: string; succMsg: string; errMsg: string },
  ) {
    ora.start(std.startMsg)
    const { command, options, args } = _options
    try {
      const { stdout, stderr, failed, signal, exitCode } = await run(
        command,
        this.context,
        options,
        args,
      )
      const isFailure = failed || signal || exitCode !== 0
      if (isFailure) {
        throw new Error(`${stderr}\nexecution ${command} failed`)
      }
      ora.stop('succeed', std.succMsg)
      if (stdout) {
        log.info(stdout as string)
      }
      if (stderr) {
        log.warn(stderr as string)
      }
    } catch (err: any) {
      ora.stop('fail', std.errMsg)
      log.error((err.message as string) ?? '')
      throw err
    }
  }

  // 发布前的准备工作
  async preBeforeRelease() {
    if (this.config.beforLaunch) {
      if (Array.isArray(this.config.beforLaunch)) {
        for (let i = 0; i < this.config.beforLaunch.length; ++i) {
          const command = this.config.beforLaunch[i]!
          command &&
            (await this.runCommon(
              { command, options: { reject: false } },
              {
                startMsg: `start execution ${command}....`,
                succMsg: `success execution ${command}`,
                errMsg: `error execution ${command}`,
              },
            ))
        }
      } else {
        log.error(
          `beforLaunch should be an array, but the type you set is ${typeof this.config.beforLaunch}`,
        )
        throw new Error()
      }
    }
  }

  // 压缩构建产物
  async compressFiles() {
    const files: string[] = []
    // 读取文件
    if (this.config.dockerBuildFiles && this.config.dockerBuildFiles.length > 0) {
      let dockerfileFlag = false,
        dockerignoreFlag = false
      for (let i = 0; i < this.config.dockerBuildFiles.length; ++i) {
        const file = this.config.dockerBuildFiles[i] as string
        if (/\bDockerfile\b/.test(file)) {
          dockerfileFlag = true
        }
        if (/\bDockerfile\b/.test(file)) {
          dockerignoreFlag = true
        }
        if (dockerfileFlag && dockerignoreFlag) break
      }
      if (!dockerfileFlag) {
        // 默认加入Dockerfile
        this.config.dockerBuildFiles.push('Dockerfile')
      }
      if (!dockerignoreFlag && fs._.existsSync(path.resolve(this.context, '.dockerignore'))) {
        // 默认加入.dockerignore
        this.config.dockerBuildFiles.push('.dockerignore')
      }
      this.config.dockerBuildFiles.forEach(async file => {
        const fullPath = path.resolve(this.context, file)
        if (fs._.existsSync(fullPath)) {
          files.push(fullPath)
        } else {
          log.error(`The file name is ${file}, and the file does not exist`)
          throw new Error()
        }
      })
    } else {
      log.error(
        `The file to build the image cannot be empty. Please check whether dockerBuildFiles is set correctly`,
      )
      throw new Error()
    }

    // 打包
    const output = fs.createWriteStream(path.resolve(this.context, this.uploadFileName))
    const archive = archiver('tar', { gzip: true, gzipOptions: { level: 9 } })
    archive.pipe(output)
    const waitForArchiveEnd = new Promise((resolve, rejects) => {
      archive.on('error', function (err) {
        log.error(`Error in compressed file`)
        rejects(new Error(err.message))
      })
      archive.on('end', () => {
        log.done(`✔ Success in compressed file`)
        resolve('')
      })
    })

    const fileNames = []
    for (const file of files) {
      const fileName = path.basename(file)
      fileNames.push(fileName)
      if (await fs.isDirectory(file)) {
        archive.directory(file, fileName)
      } else {
        archive.file(file, { name: fileName })
      }
    }
    await archive.finalize()
    await waitForArchiveEnd
  }

  async uploadSSH(ssh: NodeSSH) {
    await this.compressFiles()
    const uploadPath = path.resolve(this.context, this.uploadFileName)
    if (await fs.exist(uploadPath)) {
      const state = await fs.getFileStat(uploadPath)
      const localSize = state.size

      await ora.start(
        '📤 开始上传...',
        async () => {
          await ssh.putFile(uploadPath, this.remotePath)
        },
        status => {
          if (status) return `文件上传完成`
          else {
            exit(1)
            return chalk.error(`exit code: 1`)
          }
        },
      )

      const exists = await ssh.execCommand(
        `test -f "${this.remotePath}" && echo "yes" || echo "no"`,
      )
      if (exists.stdout.trim() !== 'yes') {
        log.error('文件上传检测失败')
        throw new Error()
      }
      const sizeResult = await ssh.execCommand(`stat -c %s "${this.remotePath}"`)
      const remoteSize = parseInt(sizeResult.stdout.trim(), 10)
      if (isNaN(remoteSize)) {
        log.error('无法获取远程文件大小')
        throw new Error()
      }
      if (remoteSize !== localSize && remoteSize < localSize - 10) {
        log.error(`文件大小不匹配: 本地=${localSize}, 远程=${remoteSize}`)
        throw new Error()
      }
    } else {
      log.error(`The file to be uploaded is not found.`)
      throw new Error()
    }
  }

  async execCommand(
    ssh: NodeSSH,
    std: { startMsg: string; succMsg: string; errMsg?: string },
    command: string,
  ) {
    if (!command || !std.startMsg || !std.succMsg || !ssh) throw new Error()
    ora.start(std.startMsg)
    const { stderr, code } = await ssh.execCommand(command)
    if (code !== 0 || (stderr && code !== 0)) {
      ora.stop('fail', stderr)
      throw new Error()
    }
    ora.stop('succeed', std.succMsg)
    stderr && log.info(stderr)
  }

  async dockcerImageBuild(ssh: NodeSSH) {
    await this.uploadSSH(ssh)
    try {
      const REMOTEAPPPATH = this.REMOTEAPPPATH
      const CONTAINER_NAME = this.config.containerName
      const REMOTE_PATH = this.remotePath
      const IMAGE_TAG = this.config.imageTag
      const TARGET_DIR = `./${CONTAINER_NAME}`

      // 解压压缩包
      await this.execCommand(
        ssh,
        {
          startMsg: 'Start decompress project....',
          succMsg: 'Decompress project completed.',
        },
        `
          if ! cd "${REMOTEAPPPATH}" &>/dev/null; then
            mkdir -p "${REMOTEAPPPATH}";
            cd "${REMOTEAPPPATH}";
          fi
          mkdir -p "${TARGET_DIR}"

          if [ ! -f "${REMOTE_PATH}" ]; then
            echo "❌ 错误：压缩包不存在: ${REMOTE_PATH}";
            exit 1
          fi
          tar -xzf "${REMOTE_PATH}" -C "${TARGET_DIR}";
      `,
      )

      // 构建容器 @TODO ocker push 到远端的服务器,然后再通过远端的服务器进行拉取，这个平台可以进行版本控制和安全检测
      await this.execCommand(
        ssh,
        {
          startMsg: `🐳 构建镜像: ${IMAGE_TAG}...`,
          succMsg: `🐳 构建镜像: ${IMAGE_TAG}成功.`,
        },
        `
        cd "${REMOTEAPPPATH}"
        docker build -t ${IMAGE_TAG} ${TARGET_DIR}
      `,
      )

      // 清理旧容器
      await this.execCommand(
        ssh,
        {
          startMsg: `🔄 停止并清理旧容器: ${CONTAINER_NAME}...`,
          succMsg: `旧容器已经清理成功.`,
        },
        `
        if docker inspect "${CONTAINER_NAME}" >/dev/null 2>&1; then
          docker stop "${CONTAINER_NAME}";
          docker rm "${CONTAINER_NAME}";
        else
          echo "ℹ️  容器 ${CONTAINER_NAME} 不存在，跳过清理";
        fi
      `,
      )

      // 启动容器
      await this.execCommand(
        ssh,
        {
          startMsg: `🐳 启动容器: ${CONTAINER_NAME}...`,
          succMsg: `🐳 启动容器成功.`,
        },
        `
        docker run -d --name ${CONTAINER_NAME} -p ${this.config.BindPorts} ${IMAGE_TAG}
      `,
      )

      log.done('✔ 部署完成')
    } catch {
      log.error('✖ 部署失败')
    } finally {
      await this.clear(ssh)
    }
  }

  async clear(ssh: NodeSSH) {
    await ssh.execCommand(`rm -f ${this.remotePath}`)
    await ssh.execCommand(`rm -rf ${this.REMOTEAPPPATH}/${this.config.containerName}`)
    await ssh.execCommand(`docker image prune -f`) // 清理悬空镜像
  }
}
