import type { inquirerOptions } from './type/inquirer.ts'
import { fs, inquirer } from './utils/index.ts'
import path from 'path'

const configMethod: { [key: string]: inquirerOptions } = {
  host: {
    type: 'input',
    message: '远程服务器 IP 或域名: ',
  },
  port: {
    type: 'number',
    message: 'SSH 端口: ',
  },
  user: {
    type: 'input',
    message: '用户名: ',
  },
  password: {
    type: 'input',
    message: '密码: ',
  },
  beforLaunch: {
    type: 'input',
    message: '项目发布前的前置命令(befor launch) 多个以 , 隔开: ',
    handleFn: (value: string): string[] => value.split(','),
  },
  dockerBuildFiles: {
    type: 'input',
    message: 'docker构建所需的文件相对根目录的路径(多个 , 隔开): ',
    handleFn: (value: string): string[] => value.split(','),
  },
  imageTag: {
    type: 'input',
    message: 'Image tag: ',
  },
  containerName: {
    type: 'input',
    message: 'Container name: ',
  },
  BindPorts: {
    type: 'input',
    message: 'Bind Ports(such as 8080:8080): ',
  },
}

export async function createConfig(rootPath: string) {
  const config: any = {}
  const keys = Object.keys(configMethod)
  for (let i = 0; i < keys.length; ++i) {
    const key = keys[i] as string
    const fn = Object.hasOwn(configMethod[key]!, 'handleFn')
      ? configMethod[key]!.handleFn
      : (value: any): any => {
          if (typeof value === 'string') return value.trim()
          else return value
        }
    const value = (await inquirer.invoke(configMethod[key]!)) as string
    config[key] = fn(value)
  }
  await fs.writeFileSync(
    path.resolve(rootPath, 'deploy-config.json'),
    JSON.stringify(config, null, 2),
  )
  const gitIgnorePath = path.resolve(rootPath, '.gitignore')
  let contain: string = ''
  if (await fs.exist(gitIgnorePath)) {
    contain = (await fs.readDirOrFile(gitIgnorePath)) as string
  }
  if (contain.includes('deploy-config.json')) return
  contain += '\ndeploy-config.json\n'
  fs.writeFileSync(gitIgnorePath, contain)
}
