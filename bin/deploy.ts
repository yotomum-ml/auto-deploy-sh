import type { sshConfig } from './type/types'
import { log, ora, run, fs, exit, chalk, inquirer } from './utils/index.ts'
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
      if (this.config.Dockerfile && this.config.Dockerfile.length > 0) {
        // 单独配置了Dockerfile
        dockerfileFlag = true
        this.config.dockerBuildFiles.push(this.config.Dockerfile)
      }
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
      let isEmptyFile = false
      this.config.dockerBuildFiles.forEach(async file => {
        const fullPath = path.resolve(this.context, file)
        if (fs._.existsSync(fullPath)) {
          files.push(fullPath)
        } else {
          log.error(`The file name is ${file}, and the file does not exist`)
          isEmptyFile = true
        }
      })
      if (isEmptyFile) throw new Error()
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
        if (this.config.Dockerfile && fileName === path.basename(this.config.Dockerfile)) {
          archive.file(file, { name: 'Dockerfile' })
          continue
        }
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
        '📤 Start uploading...',
        async () => {
          await ssh.putFile(uploadPath, this.remotePath)
        },
        status => {
          if (status) return `File upload complete.`
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
        log.error('File upload failed.')
        throw new Error()
      }
      const sizeResult = await ssh.execCommand(`stat -c %s "${this.remotePath}"`)
      const remoteSize = parseInt(sizeResult.stdout.trim(), 10)
      if (isNaN(remoteSize)) {
        log.error('Unable to obtain remote file size')
        throw new Error()
      }
      if (remoteSize !== localSize && remoteSize < localSize - 10) {
        log.error(`File size mismatch: local=${localSize}, remote=${remoteSize}`)
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

      // 识别是否存在network
      if (typeof this.config.Options?.networks === 'string') {
        this.config.Options.networks = [this.config.Options.networks]
      }
      const networks = this.config.Options?.networks || []
      if (networks.length > 0) {
        await this.judgeNetwork(ssh, networks)
      }

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
            echo "❌ Error: Compressed file does not exist.: ${REMOTE_PATH}";
            exit 1
          fi
          tar -xzf "${REMOTE_PATH}" -C "${TARGET_DIR}";
      `,
      )

      // 构建容器
      await this.buildDocker(ssh, IMAGE_TAG, REMOTEAPPPATH, TARGET_DIR, CONTAINER_NAME)

      // 启动容器
      await this.runDocker(ssh, CONTAINER_NAME)

      log.done('✔ Deployment completed.')
    } catch {
      log.error('✖ Deployment failed.')
    } finally {
      await this.clear(ssh)
    }
  }

  // 构建容器
  async buildDocker(
    ssh: NodeSSH,
    IMAGE_TAG: string,
    REMOTEAPPPATH: string,
    TARGET_DIR: string,
    CONTAINER_NAME: string,
  ) {
    // 构建容器 @TODO docker push 到远端的服务器,然后再通过远端的服务器进行拉取，这个平台可以进行版本控制和安全检测
    await this.execCommand(
      ssh,
      {
        startMsg: `🐳 Build image: ${IMAGE_TAG}...`,
        succMsg: `🐳 Build image: ${IMAGE_TAG} success.`,
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
        startMsg: `🔄 Stop and clean the old container.: ${CONTAINER_NAME}...`,
        succMsg: `The old container has been successfully cleaned.`,
      },
      `
        if docker inspect "${CONTAINER_NAME}" >/dev/null 2>&1; then
          docker stop "${CONTAINER_NAME}";
          docker rm "${CONTAINER_NAME}";
        else
          echo "ℹ️  container ${CONTAINER_NAME}. Does not exist, skip cleaning.";
        fi
      `,
    )
  }

  // 启动容器
  async runDocker(ssh: NodeSSH, CONTAINER_NAME: string) {
    let optionsCLI = `--name ${CONTAINER_NAME}${this.config.BindPorts ? ` -p ${this.config.BindPorts}` : ''}`
    if (this.config.restart) {
      optionsCLI += ` --restart ${this.config.restart}`
    }
    const options = this.config.Options
    if (options) {
      const optionsKeys = Object.keys(options)
      if (optionsKeys.length > 0) {
        for (let i = 0; i < optionsKeys.length; ++i) {
          const key = optionsKeys[i]
          switch (key) {
            case 'volumes': {
              let volumes = options.volumes.map(volume => `-v ${volume}`).join(' ')
              optionsCLI += ' ' + volumes
              break
            }
            case 'networks': {
              let cli = ''
              if (Array.isArray(options.networks)) {
                cli = options.networks.map((network: string) => `--network ${network}`).join(' ')
              } else {
                cli = `--network ${options.networks}`
              }
              optionsCLI += ` ${cli}`
              break
            }
            default:
              break
          }
        }
      }
    }
    optionsCLI += ` ${this.config.imageTag}`
    await this.execCommand(
      ssh,
      {
        startMsg: `🐳 Start container: ${CONTAINER_NAME}...`,
        succMsg: `🐳 Container started successfully.`,
      },
      `
        docker run -d ${optionsCLI}
      `,
    )
  }

  // 识别network是否存在，不存则提示创建
  async judgeNetwork(ssh: NodeSSH, networks: string[]) {
    // 1. 判断network是否存在，返回不存在的network列表
    // 2. 不存则利用inquirer进行询问创建，取消则退出，统一则创建
    const { stderr, code, stdout } = await ssh.execCommand(`docker network ls --format '{{.Name}}'`)
    if (code !== 0 || (stderr && code !== 0)) {
      stderr && log.error(stderr)
      throw new Error()
    }
    const existNetworks = new Set(
      stdout
        .split('\n')
        .map(item => item.trim())
        .filter(Boolean),
    )
    const missingNetworks = networks.filter(network => !existNetworks.has(network))
    if (missingNetworks.length > 0) {
      // 存在不存在的network
      const answer = await inquirer.invoke({
        type: 'confirm',
        message: `The following Docker networks do not exist:\n${JSON.stringify(missingNetworks)}\nDo you want to create them now?`,
      })
      if (answer) {
        let cli = missingNetworks.map(name => `docker network create ${name}`).join(' && ')
        await this.execCommand(
          ssh,
          {
            startMsg: `Creating missing Docker networks...`,
            succMsg: `Missing Docker networks created successfully.`,
          },
          cli,
        )
      } else {
        log.error('Deployment aborted due to missing Docker networks.')
        throw new Error()
      }
    }
  }

  async clear(ssh: NodeSSH) {
    await ssh.execCommand(`rm -f ${this.remotePath}`)
    await ssh.execCommand(`rm -rf ${this.REMOTEAPPPATH}/${this.config.containerName}`)
    await ssh.execCommand(`docker image prune -f`) // 清理悬空镜像
    // @TODO清空悬空的network
  }
}
