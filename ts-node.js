// Adapt to the operation of TS files

import { register } from 'node:module'
import { pathToFileURL } from 'node:url'
import chalk from 'chalk'

try {
  register('ts-node/esm', pathToFileURL('./'))
  const [, , entry] = process.argv
  if (!entry) {
    console.log(
      chalk.hex('#F56C6C')('Missing entry file to run. Usage: node test.js [script-path]'),
    )
    process.exit(1)
  }
  await import(pathToFileURL(entry).href)
} catch (err) {
  console.log('Error: ', err)
}
