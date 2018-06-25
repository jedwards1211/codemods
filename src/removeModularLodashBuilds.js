#!/usr/bin/env node

const path = require('path')
const findRoot = require('find-root')
const {spawn, execFile} = require('promisify-child-process')
const fs = require('fs-extra')
const JSON5 = require('json5')

const lodashModularPackageRx = /^lodash\.(.+)$/

async function isFile(file) {
  try {
    return (await fs.statSync(file)).isFile()
  } catch (error) {
    return false
  }
}

module.exports = async function removeModularLodashBuilds() {
  const root = findRoot(process.cwd())
  const packageJson = require(path.resolve(root, 'package.json'))
  const {dependencies, devDependencies, peerDependencies, optionalDependencies} = packageJson
  function isLodashModularPackage(pkg) {
    return lodashModularPackageRx.test(pkg)
  }
  const lodashModularDependencies = Object.keys(dependencies || {}).filter(isLodashModularPackage)
  const lodashModularDevDependencies = Object.keys(devDependencies || {}).filter(isLodashModularPackage)
  const lodashModularPeerDependencies = Object.keys(peerDependencies || {}).filter(isLodashModularPackage)
  const lodashModularOptionalDependencies = Object.keys(optionalDependencies || {}).filter(isLodashModularPackage)
  const lodashModularPackages = [
    ...lodashModularDependencies,
    ...lodashModularDevDependencies,
    ...lodashModularPeerDependencies,
    ...lodashModularOptionalDependencies,
  ]
  if (!lodashModularPackages.length) {
    console.error('No modular lodash packages found') // eslint-disable-line no-console
    return
  }

  const isDev = lodashModularDevDependencies.length &&
    !lodashModularDependencies.length &&
    !lodashModularOptionalDependencies.length

  const spawnOpts = {cwd: root, stdio: 'inherit'}

  if (await isFile(path.resolve(root, 'yarn.lock'))) {
    await spawn('yarn', ['remove', ...lodashModularPackages], spawnOpts)
    await spawn('yarn', isDev ? ['add', '--dev', 'lodash'] : ['add', 'lodash'], spawnOpts)
    await spawn('yarn', ['add', '--dev', 'babel-plugin-lodash'], spawnOpts)
  } else {
    await spawn('npm', ['remove', '--save', ...lodashModularPackages], spawnOpts)
    await spawn('npm', ['add', isDev ? '--save-dev' : '--save', 'lodash'], spawnOpts)
    await spawn('npm', ['add', '--save-dev', 'babel-plugin-lodash'], spawnOpts)
  }

  const babelrcFile = path.resolve(root, '.babelrc')
  const babelrc = JSON5.parse(await fs.readFile(babelrcFile))
  let babelrcChanged = false
  if (babelrc.plugins) {
    babelrcChanged = true
    babelrc.plugins.push('lodash')
  }
  if (babelrc.env) {
    for (let key in babelrc.env) {
      if (babelrc.env[key].plugins) {
        babelrcChanged = true
        babelrc.env[key].plugins.push('lodash')
      }
    }
  }
  if (babelrcChanged) await fs.writeFile(babelrcFile, JSON5.stringify(babelrc, null, 2))

  await spawn(`jscodeshift`, [
    '-t',
    require.resolve('./switchToMonolithicLodash'),
    '--parser=babylon',
    path.resolve(root, '*.js'),
    path.resolve(root, 'src'),
    path.resolve(root, 'test'),
  ], spawnOpts)

  const eslintFile = path.resolve(root, 'node_modules', '.bin', 'eslint')
  if (await isFile(eslintFile)) {
    await execFile(eslintFile, ['--fix', '*.js', 'src', 'test'], {cwd: root})
  }
}

if (!module.parent) module.exports().then(
  console.log, // eslint-disable-line no-console
  error => {
    console.error(error.stack) // eslint-disable-line no-console
    process.exit(1)
  }
)
