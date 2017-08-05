import Job from './Job'
import log from '../utils/log'
import serverConfig from 'frontful-config/server'
import {store} from './store'

// See `frontful-environment`s coldreload `README.md`
if (process.frontful_processor) {
  if (process.frontful_processor.timeout) {
    clearTimeout(process.frontful_processor.timeout)
  }
  process.frontful_processor.start = () => {}
}

export default process.frontful_processor = {
  start() {
    this.timeout = setTimeout(() => {
      this.process().then(() => {
        this.start()
      }).catch((error) => {
        log.error(error)
        this.start()
      })
    }, serverConfig.processor.interval)
  },
  getProcessing() {
    return store.getProcessing().then((model) => {
      return model ? new Job(model) : null
    })
  },
  getQueued() {
    return store.getQueued().then((model) => {
      return model ? new Job(model) : null
    })
  },
  process() {
    return this.getProcessing().then((job) => {
      if (!job) {
        return this.getQueued().then((job) => {
          if (job) {
            return job.process().then(() => {
              return this.process()
            })
          }
        })
      }
      else {
        return job.validate()
      }
    })
  }
}
