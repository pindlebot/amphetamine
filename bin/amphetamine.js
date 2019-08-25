#!/usr/bin/env node

const yargs = require('yargs')
const { getWorkspaces, spawn } = require('../src')

const cwd = process.cwd()

const YARN_BIN_PATH = '/usr/local/bin/yarn'

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
      const workspaces = await getWorkspaces()

      while (workspaces.length) {
        const [name, workspace] = workspaces.shift()
        const { location, pkg } = workspace
        if (
          !(pkg.scripts && pkg.scripts[argv.command])
        ) {
          continue
        }

        const args = [argv.command, ...argv._]

        try {
          await spawn(YARN_BIN_PATH, args, {
            stdio: 'inherit',
            cwd: location
          })
        } catch (err) {
          console.error(err)
        }
      }
    })
  .argv
