#!/usr/bin/env node

const path = require('path')
const glob = require('fast-glob')

async function getWorkspaces () {
  const cwd = process.cwd()
  const rootPackageJsonPath = path.join(cwd, 'package.json')
  const packageJson = require(rootPackageJsonPath)
  const files = await Promise.all(
    packageJson.workspaces.map(
      pattern => glob(pattern)
    )
  )

  const flatFiles = files.reduce((a, p) => {
    a = a.concat(p.filter(q => q.endsWith('package.json')))
    return a
  }, [])

  const workspaces = flatFiles
    .map(packageJsonPath => {
      const absPath = path.join(process.cwd(), packageJsonPath)
      const location = path.dirname(absPath)
      const pkg = require(absPath)

      if (!pkg.scripts) {
        pkg.scripts = {}
      }

      return [pkg.name, { location, pkg }]
    })
  return workspaces
}

module.exports.getWorkspaces = getWorkspaces
