#!/usr/bin/env node

const yargs = require('yargs')
const getWorkspaces = require('../src/getWorkspaces')
const spawn = require('../src/spawn')
const chalk = require('chalk')
const cwd = process.cwd()

try {
  require('v8-compile-cache')
} catch (err) {

}

const _ = yargs
  .command(
    '$0 [command]',
    'Run a command in every workspace',
    (yargs) => {
      return yargs
        .positional('command', {
          type: 'string',
          description: 'command'
        })
        .option('parallel', {
          type: 'boolean',
          description: 'Run parallel',
          default: true
        })
        .demandOption('command', 'Please provide the command to run in each workspace')
    }, async (argv) => {
      const start = process.hrtime()
      const workspaces = await getWorkspaces()
      await Promise.all(
        workspaces
          .filter(([name, workspace]) => workspace.pkg.scripts && workspace.pkg.scripts[argv.command])
          .map(([name, workspace]) => spawn('yarn', [argv.command, ...argv._], {
            // stdio: 'inherit',
            cwd: workspace.location
          }, (buffer) => {
            console.log(
              chalk.rgb(96, 97, 190)(`[${name}]: `) + chalk.white(buffer.toString().trim())
            )
          }))
      )

      const end = process.hrtime(start)
      console.log(`Took ${end[0]} seconds`)
    })
  .argv
