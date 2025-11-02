// #!/usr/bin/env node
import { program } from 'commander'
import { fs } from '../bin/utils/fse.ts'
import path from 'path'
import { fileURLToPath } from 'url'
import { deploySSH } from '../bin/index.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let pkgPath = path.join(__dirname, '../package.json')
if (!(await fs.exist(pkgPath))) {
  // 兼容发布
  pkgPath = path.join(__dirname, '../../package.json')
}
const packageJson = JSON.parse((await fs.readDirOrFile(pkgPath, { encoding: 'utf-8' })) as any)

type AutoDeployShConfig = {
  file: string
}

program
  .name(packageJson.name)
  .description(packageJson.description)
  .version(`v${packageJson.version}`)
  .argument('[path]', 'deployment configuration file')
  .option('-f, --file <path>', 'set deployment configuration file', 'deploy-config.json')
  .action((path, options: AutoDeployShConfig) => {
    const targetPath = path ?? options.file
    if (typeof targetPath !== 'string' || targetPath.trim() === '') {
      throw new Error(`Invalid path: ${targetPath}, path must be a non-empty string`)
    }
    deploySSH(targetPath)
  })
  .parse()
