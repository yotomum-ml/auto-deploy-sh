import type { inquirerOptions } from './type/inquirer.ts'
import { fs, inquirer } from './utils/index.ts'
import path from 'path'

const configMethod: { [key: string]: inquirerOptions } = {
  host: {
    type: 'input',
    message: 'Remote server IP or domain name: ',
  },
  port: {
    type: 'number',
    message: 'SSH port: ',
  },
  user: {
    type: 'input',
    message: 'username: ',
  },
  password: {
    type: 'input',
    message: 'password: ',
  },
  beforLaunch: {
    type: 'input',
    message: 'Before launch (multiple commands separated by , ): ',
    handleFn: (value: string): string[] => value.split(','),
  },
  dockerBuildFiles: {
    type: 'input',
    message:
      'Path to the file relative to the root directory required for Docker build (separated by , ): ',
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
const optionsMethod: { [key: string]: inquirerOptions } = {
  volumes: {
    type: 'input',
    message: 'Multiple volumes are divided into by , : ',
    handleFn: (value: string): string[] => value.split(','),
  },
  networks: {
    type: 'input',
    message: 'Bound network: ',
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
  // Extended options
  const options = await inquirer.invoke({
    type: 'checkbox',
    message: 'Select other options as needed.',
    choices: [
      { name: 'Volumes', value: 'volumes' },
      { name: 'Networks', value: 'networks' },
    ],
  })
  config['Options'] = {}
  for (let i = 0; i < options.length; ++i) {
    const key = options[i]
    const fn = Object.hasOwn(optionsMethod[key]!, 'handleFn')
      ? optionsMethod[key]!.handleFn
      : (value: any): any => {
          if (typeof value === 'string') return value.trim()
          else return value
        }
    const value = (await inquirer.invoke(optionsMethod[key]!)) as string
    config['Options'][key] = fn(value)
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
