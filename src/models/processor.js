import Job from './Job'
import log from '../utils/log'
import serverConfig from 'frontful-config/server'
import {WaitError} from './Errors'
import {email} from '../utils/email'
import {getStatus} from '../utils/status'
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
    }, serverConfig.processor.pollingInterval)
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
    if (getStatus() === 'started') {
      return this.getProcessing().then((job) => {
        if (!job) {
          return this.getQueued().then((job) => {
            if (job) {
              return job.process().catch((error) => {
                if (error instanceof WaitError) {
                  throw error
                }
                else {
                  return email(job.state.id).then(() => {throw error}).catch(() => {throw error})
                }
              }).then(() => {
                return (job.state.status === 'warning' ? email(job.state.id).catch(() => {}) : Promise.resolve()).then(() => {
                  return this.process()
                })
              }).catch((error) => {
                if (error instanceof WaitError) {
                  return null
                }
                else {
                  throw error
                }
              })
            }
          })
        }
        else {
          return Promise.resolve(job.validate()).catch((error) => {
            return email(job.state.id).then(() => {throw error}).catch(() => {throw error})
          })
        }
      })
    }
    else {
      return Promise.resolve()
    }
  }
}
