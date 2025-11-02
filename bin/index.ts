// #!/usr/bin/env node
import path from 'path'
import { NodeSSH } from 'node-ssh'
import { log, ora, exit, chalk, fs } from './utils/index.ts'
import type { sshConfig } from './type/types.ts'
import { Deploy } from './deploy.ts'
import { createConfig } from './config.ts'

export async function deploySSH(configFile: string = 'deploy-config.json') {
  const ssh = new NodeSSH()
  const CONFIG_FILE = configFile ?? 'deploy-config.json'
  const CONFIG_FILE_PATH: string = path.resolve(process.cwd(), CONFIG_FILE)
  if (await fs.exist(CONFIG_FILE_PATH)) {
    let config = JSON.parse(
      (await fs.readDirOrFile(CONFIG_FILE_PATH, { encoding: 'utf-8' })) as string,
    ) as sshConfig
    if (!config.BindPorts.includes(':')) {
      log.error('Config BindPorts do not meet the standard')
      exit(1)
    }

    // 建立连接
    await ora.start(
      'conneting ssh...',
      async () =>
        await ssh.connect({
          host: config.host,
          port: config.port,
          username: config.user,
          password: config.password,
        }),
      status => {
        if (status) return `SSH connection successful!`
        else {
          log.error('SSH connection failed!')
          exit(1)
          return chalk.error(`exit code: 1`)
        }
      },
    )

    const deploy = new Deploy(config, process.cwd())
    try {
      await deploy.preBeforeRelease()
      await deploy.dockcerImageBuild(ssh)
    } catch {
      // 防止重复错误抛出
    } finally {
      fs.removeSync(path.resolve(process.cwd(), deploy.uploadFileName))
      ssh.dispose()
      exit(1)
    }
  } else {
    log.error(
      `⚠️ No configuration file found in the root directory ${CONFIG_FILE}. Will guide the creation... `,
    )
    await createConfig(process.cwd())
    deploySSH()
  }
}
