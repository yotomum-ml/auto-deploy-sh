import fs from 'fs'
import path from 'path'

// 编译后的文件
const filePath = path.resolve(process.cwd(), './dist/cli/index.js')

let content = fs.readFileSync(filePath, 'utf8')

// 插入 shebang 在第一行
content = '#!/usr/bin/env node\n' + content

fs.writeFileSync(filePath, content, 'utf8')
