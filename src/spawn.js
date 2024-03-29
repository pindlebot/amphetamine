const child = require('child_process')
const BlockingQueue = require('./BlockingQueue')

const queue = new BlockingQueue('child')

module.exports = function spawn (
  program,
  args,
  opts,
  cb
) {
  return queue.push(
    opts.cwd,
    () => new Promise((resolve, reject) => {
      const proc = child.spawn(program, args, opts)
      proc.on('error', (err) => {
        reject(err)
      })
      proc.stdout.on('data', (chunk) => {
        cb(chunk)
      })
      proc.on('close', (code, signal) => {
        if (signal || code >= 1) {
          reject([
            'Command failed.',
            signal ? `Exit signal: ${signal}` : `Exit code: ${code}`
          ].join('\n'))
        } else {
          resolve()
        }
      })
    })
  )
}