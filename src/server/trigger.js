import log from '../utils/log'
import serverConfig from 'frontful-config/server'
import {http} from '../models/http'
import {getStatus} from '../utils/status'

if (process.frontful_triggers) {
  process.frontful_triggers.forEach((trigger) => {
    if (trigger.timeout) {
      clearTimeout(trigger.timeout)
    }
    trigger.start = () => {}
  })
}

process.frontful_triggers = Object.keys(serverConfig.trigger || {}).map((path) => ({
  start() {
    this.timeout = setTimeout(() => {
      if (getStatus() === 'started') {
        http.get(path).then(() => {
          this.start()
        }).catch((error) => {
          log.error(error)
          this.start()
        })
      }
      else {
        this.start()
      }
    }, serverConfig.trigger[path])
  }
}))

process.frontful_triggers.forEach((trigger) => trigger.start())
