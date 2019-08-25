// lifted from: https://github.com/yarnpkg/yarn/blob/master/src/util/blocking-queue.js

module.exports = class BlockingQueue {
  constructor (alias, maxConcurrency = Infinity) {
    this.concurrencyQueue = []
    this.maxConcurrency = maxConcurrency
    this.runningCount = 0
    this.alias = alias

    this.running = []
    this.queue = []
  }

  push (key, factory) {
    return new Promise((resolve, reject) => {
      // we're already running so push ourselves to the queue
      const queue = (this.queue[key] = this.queue[key] || [])
      queue.push({ factory, resolve, reject })

      if (!this.running[key]) {
        this.shift(key)
      }
    })
  }

  shift (key) {
    if (this.running[key]) {
      delete this.running[key]
      this.runningCount--
    }

    const queue = this.queue[key]
    if (!queue) {
      return
    }

    const {resolve, reject, factory} = queue.shift()
    if (!queue.length) {
      delete this.queue[key]
    }

    const next = () => {
      this.shift(key)
      this.shiftConcurrencyQueue()
    }

    const run = () => {
      this.running[key] = true
      this.runningCount++

      factory()
        .then(function(val) {
          resolve(val)
          next()
          return null
        })
        .catch(function(err) {
          reject(err)
          next()
        })
    }

    this.maybePushConcurrencyQueue(run)
  }

  maybePushConcurrencyQueue (run) {
    if (this.runningCount < this.maxConcurrency) {
      run()
    } else {
      this.concurrencyQueue.push(run)
    }
  }

  shiftConcurrencyQueue () {
    if (this.runningCount < this.maxConcurrency) {
      const fn = this.concurrencyQueue.shift()
      if (fn) {
        fn()
      }
    }
  }
}
