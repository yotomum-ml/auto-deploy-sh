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
  Dockerfile: {
    type: 'input',
    message: 'Select the Dockerfile you need to execute.',
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
  restart: {
    type: 'select',
    message: 'Container restart policy (when should Docker restart this container?)',
    choices: [
      {
        name: 'no (default)',
        value: 'no',
        description: 'Never restart. Container stays stopped even after Docker or system restarts.',
      },
      {
        name: 'always',
        value: 'always',
        description:
          'Always restart if it stops. Will also start automatically after Docker or system reboot.',
      },
      {
        name: 'unless-stopped (recommended)',
        value: 'unless-stopped',
        description:
          'Restart automatically unless you manually stop it. Will NOT restart again if stopped by user.',
      },
      {
        name: 'on-failure',
        value: 'on-failure',
        description:
          'Restart only on non-zero exit code. Useful for jobs or scripts that may fail.',
      },
    ],
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
    message: 'Bound networks (separated by , ): ',
    handleFn: (value: string): string[] => value.split(','),
  },
  logging: {
    type: 'confirm',
    message: 'Do you want to enable Docker log management?',
    default: false,
    handleFn: async (value: boolean): Promise<Record<string, any>> => {
      if (!value) return {}
      const loggingDriver: inquirerOptions = {
        type: 'select',
        message: 'Select a logging driver for the container: ',
        choices: [
          {
            name: 'json-file (default)',
            value: 'json-file',
            description:
              'Write logs as JSON files on the host. Docker default and supports max-size/max-file.',
          },
          {
            name: 'local (recommended)',
            value: 'local',
            description:
              'Write logs in Docker local format. More efficient for local log rotation and disk usage.',
          },
          {
            name: 'none',
            value: 'none',
            description:
              'Disable container logging. Useful when logs are handled entirely by the app.',
          },
          {
            name: 'syslog',
            value: 'syslog',
            description: 'Send logs to the syslog service.',
          },
          {
            name: 'journald',
            value: 'journald',
            description: 'Send logs to systemd journald.',
          },
          {
            name: 'gelf',
            value: 'gelf',
            description: 'Send logs to a Graylog Extended Log Format endpoint.',
          },
          {
            name: 'fluentd',
            value: 'fluentd',
            description: 'Send logs to a Fluentd collector.',
          },
          {
            name: 'awslogs',
            value: 'awslogs',
            description: 'Send logs to Amazon CloudWatch Logs.',
          },
          {
            name: 'splunk',
            value: 'splunk',
            description: 'Send logs to Splunk using the HTTP Event Collector.',
          },
          {
            name: 'gcplogs',
            value: 'gcplogs',
            description: 'Send logs to Google Cloud Logging.',
          },
        ],
      }
      const loggingMaxSize: inquirerOptions = {
        type: 'input',
        message: 'Logging max-size: (eg: 10m, 1g)',
        default: '10m',
      }
      const loggingMaxFile: inquirerOptions = {
        type: 'input',
        message: 'Logging max-file: (eg: 3)',
        default: '3',
      }
      const driver = await inquirer.invoke(loggingDriver)
      let options: Record<string, any> = {
        'max-size': await inquirer.invoke(loggingMaxSize),
        'max-file': await inquirer.invoke(loggingMaxFile),
      }

      if (driver === 'json-file') {
        const compress = await inquirer.invoke({
          type: 'confirm',
          message: 'Do you want to enable log compression?',
          default: false,
        })
        options['compress'] = compress
      }
      return {
        driver,
        options: options,
      }
    },
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
    config[key] = await fn(value)
  }
  // Extended options
  const options = await inquirer.invoke({
    type: 'checkbox',
    message: 'Select other options as needed.',
    choices: [
      { name: 'Volumes', value: 'volumes' },
      { name: 'Networks', value: 'networks' },
      { name: 'Logging', value: 'logging' },
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
    config['Options'][key] = await fn(value)
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
